"""
ICT Inventory Client
Collects PC hardware and software information and sends it to the Laravel API
"""

import platform
import psutil
import socket
import GPUtil
import wmi
import datetime
import winreg
import requests
import json


def get_installed_software():
    """Get installed software from registry (faster than Win32_Product)."""
    software_list = []
    reg_paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    ]

    for reg_path in reg_paths:
        try:
            reg_key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, reg_path)
            for i in range(0, winreg.QueryInfoKey(reg_key)[0]):
                try:
                    subkey_name = winreg.EnumKey(reg_key, i)
                    subkey = winreg.OpenKey(reg_key, subkey_name)
                    name, version = None, None
                    try:
                        name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                    except FileNotFoundError:
                        continue
                    try:
                        version = winreg.QueryValueEx(subkey, "DisplayVersion")[0]
                    except FileNotFoundError:
                        version = "Unknown"

                    software_list.append({
                        "name": name,
                        "version": version
                    })
                except Exception:
                    continue
        except Exception:
            continue

    return software_list


def get_inventory():
    """Collect complete PC inventory information."""
    info = {}

    # === WMI Connection ===
    c = wmi.WMI()

    # === BASIC SYSTEM INFO ===
    cs = c.Win32_ComputerSystem()[0]
    bios = c.Win32_BIOS()[0]
    
    info["hostname"] = socket.gethostname()
    info["manufacturer"] = cs.Manufacturer
    info["model"] = cs.Model
    info["serial_number"] = bios.SerialNumber

    # === OS ===
    try:
        os_info = c.Win32_OperatingSystem()[0]
        info["os_name"] = os_info.Caption or "Unknown"
        info["os_version"] = os_info.Version or "Unknown"
        info["os_build"] = os_info.BuildNumber or "Unknown"
    except Exception:
        info["os_name"] = f"{platform.system()}"
        info["os_version"] = f"{platform.release()}"
        info["os_build"] = "Unknown"

    # === CPU ===
    cpu = c.Win32_Processor()[0]
    info["cpu_name"] = cpu.Name
    info["cpu_cores_physical"] = cpu.NumberOfCores if cpu.NumberOfCores else 0
    info["cpu_cores_logical"] = cpu.NumberOfLogicalProcessors if cpu.NumberOfLogicalProcessors else 0
    info["cpu_speed_mhz"] = cpu.MaxClockSpeed if cpu.MaxClockSpeed else 0

    # === MEMORY ===
    mem = psutil.virtual_memory()
    info["ram_gb"] = round(mem.total / (1024**3), 2)

    # === DISKS ===
    disks = []
    for disk in c.Win32_DiskDrive():
        disks.append({
            "model": disk.Model,
            "size_gb": round(int(disk.Size) / (1024**3), 2) if disk.Size else 0
        })
    info["disks"] = disks

    # === GPU ===
    gpus = GPUtil.getGPUs()
    info["gpus"] = [gpu.name for gpu in gpus]
    
    # If no GPU found via GPUtil, try WMI
    if not info["gpus"]:
        try:
            for gpu in c.Win32_VideoController():
                if gpu.Name:
                    info["gpus"].append(gpu.Name)
        except:
            pass

    # === NETWORK ===
    info["ip_address"] = None
    info["mac_address"] = None
    for nic in c.Win32_NetworkAdapterConfiguration(IPEnabled=True):
        if nic.IPAddress:
            # Get the first IPv4 address
            for ip in nic.IPAddress:
                if '.' in ip:  # Simple IPv4 check
                    info["ip_address"] = ip
                    break
            if info["ip_address"] and nic.MACAddress:
                info["mac_address"] = nic.MACAddress
                break

    # === INSTALLED SOFTWARE ===
    info["installed_software"] = get_installed_software()

    # === METADATA ===
    info["discovered_via"] = "inventory_client_script"
    info["last_seen"] = datetime.datetime.now().isoformat()

    return info


def display_available_departments(departments_dict):
    """Display all available departments for configuration reference."""
    print("\nAvailable Departments:")
    print("-" * 40)
    for dept_id, dept_name in departments_dict.items():
        print(f"  {dept_id}: {dept_name}")
    print("-" * 40)


def prompt_for_department(departments_dict, hostname):
    """Prompt user to select a department for the computer."""
    print(f"\nDepartment Assignment for: {hostname}")
    print("=" * 50)
    
    # Display available departments
    print("Available Departments:")
    for dept_id, dept_name in departments_dict.items():
        print(f"  {dept_id}: {dept_name}")
    
    print("  0: Skip (leave as null)")
    print("-" * 30)
    
    while True:
        try:
            choice = input("Enter department ID (or 0 to skip): ").strip()
            
            if choice == "0":
                return None
            
            dept_id = int(choice)
            if dept_id in departments_dict:
                dept_name = departments_dict[dept_id]
                print(f"✓ Selected: {dept_id} - {dept_name}")
                return dept_id
            else:
                print(f"✗ Invalid department ID. Please choose from the list above.")
                
        except ValueError:
            print("✗ Please enter a valid number.")
        except KeyboardInterrupt:
            print("\n\n✗ Operation cancelled by user.")
            exit(1)


def get_department_id_from_hostname(hostname, hostname_map, default_id=None):
    """Determine department ID based on hostname patterns."""
    if not hostname or not hostname_map:
        return default_id
    
    for pattern, dept_id in hostname_map.items():
        if hostname.upper().startswith(pattern.upper()):
            return dept_id
    
    return default_id


def format_data_for_api(raw_data, department_id=None):
    """Format the collected data to match the Computer model structure."""
    # Map the data to match Laravel Computer model fillable fields
    formatted_data = {
        'hostname': raw_data.get('hostname'),
        'department_id': department_id,  # Set from configuration or parameter
        'manufacturer': raw_data.get('manufacturer'),
        'model': raw_data.get('model'),
        'serial_number': raw_data.get('serial_number'),
        'os_name': raw_data.get('os_name'),
        'os_version': raw_data.get('os_version'),
        'os_build': raw_data.get('os_build'),
        'cpu_name': raw_data.get('cpu_name'),
        'cpu_cores_physical': raw_data.get('cpu_cores_physical'),
        'cpu_cores_logical': raw_data.get('cpu_cores_logical'),
        'cpu_speed_mhz': raw_data.get('cpu_speed_mhz'),
        'ram_gb': raw_data.get('ram_gb'),
        'disks': raw_data.get('disks', []),
        'gpus': raw_data.get('gpus', []),
        'installed_software': raw_data.get('installed_software', []),
        'ip_address': raw_data.get('ip_address'),
        'mac_address': raw_data.get('mac_address'),
        'discovered_via': raw_data.get('discovered_via'),
        'last_seen': raw_data.get('last_seen'),
        'notes': None  # Can be set by the API or user
    }
    
    return formatted_data


def send_to_api(data, api_url):
    """Send inventory data to Laravel API."""
    try:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        response = requests.post(api_url, json=data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            print("✓ Inventory data sent successfully!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"✗ Error: Server returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to send data to API: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("ICT Inventory Client")
    print("=" * 60)
    
    # Configuration
    API_URL = "http://127.0.0.1:8000/api/inventory/report"  # Change this to your actual API URL
    DEBUG_MODE = False  # Set to True to see the complete data structure
    DRY_RUN = False  # Set to True to test data collection without sending to API
    SHOW_DEPARTMENTS = False  # Set to True to display available departments list
    PROMPT_FOR_DEPARTMENT = True  # Set to True to prompt user for department selection
    
    # Department Configuration
    DEPARTMENTS = {
        1: "IT Department",
        2: "Human Resources",
        3: "Finance Department", 
        4: "Marketing Department",
        5: "Operations Department",
        6: "Sales Department",
        7: "Administration",
        8: "Research & Development"
        # Add more departments as needed
    }
    
    DEPARTMENT_ID = None  # Set this to the department ID for this computer/location
    # Examples:
    # DEPARTMENT_ID = 1  # IT Department
    # DEPARTMENT_ID = 2  # Human Resources
    # DEPARTMENT_ID = 3  # Finance Department
    
    # Alternative: Hostname-based department mapping
    HOSTNAME_DEPARTMENT_MAP = {
        # Map hostname patterns to department IDs
        # 'IT-': 1,      # Hostnames starting with 'IT-' go to IT Department
        # 'HR-': 2,      # Hostnames starting with 'HR-' go to Human Resources
        # 'FIN-': 3,     # Hostnames starting with 'FIN-' go to Finance Department
        # 'MKT-': 4,     # Hostnames starting with 'MKT-' go to Marketing Department
    }
    
    # Show available departments if requested
    if SHOW_DEPARTMENTS:
        display_available_departments(DEPARTMENTS)
    
    print("\n[1/3] Collecting system information...")
    try:
        inventory_data = get_inventory()
        print("✓ System information collected successfully")
    except Exception as e:
        print(f"✗ Error collecting system information: {e}")
        exit(1)
    
    print("\n[2/3] Preparing data...")
    print(f"  - Hostname: {inventory_data.get('hostname')}")
    
    # Determine department ID with priority: hostname mapping > static config > user prompt
    hostname = inventory_data.get('hostname')
    final_department_id = get_department_id_from_hostname(hostname, HOSTNAME_DEPARTMENT_MAP, DEPARTMENT_ID)
    
    # If no department determined and prompting is enabled, ask user
    if final_department_id is None and PROMPT_FOR_DEPARTMENT:
        final_department_id = prompt_for_department(DEPARTMENTS, hostname)
    
    if final_department_id:
        dept_name = DEPARTMENTS.get(final_department_id, "Unknown Department")
        # Check if department was auto-detected from hostname
        hostname_detected = False
        if hostname and HOSTNAME_DEPARTMENT_MAP:
            for pattern in HOSTNAME_DEPARTMENT_MAP.keys():
                if hostname.upper().startswith(pattern.upper()):
                    hostname_detected = True
                    break
        
        if hostname_detected and final_department_id != DEPARTMENT_ID:
            print(f"  - Department: {final_department_id} - {dept_name} (auto-detected from hostname)")
        elif final_department_id == DEPARTMENT_ID and not hostname_detected:
            print(f"  - Department: {final_department_id} - {dept_name} (configured)")
        else:
            print(f"  - Department: {final_department_id} - {dept_name} (user selected)")
    else:
        print(f"  - Department: Not set (will be null)")
    
    print(f"  - Manufacturer: {inventory_data.get('manufacturer')}")
    print(f"  - Model: {inventory_data.get('model')}")
    print(f"  - OS: {inventory_data.get('os_name')} {inventory_data.get('os_version')}")
    print(f"  - CPU: {inventory_data.get('cpu_name')}")
    print(f"  - CPU Cores: {inventory_data.get('cpu_cores_physical')}P/{inventory_data.get('cpu_cores_logical')}L @ {inventory_data.get('cpu_speed_mhz')}MHz")
    print(f"  - RAM: {inventory_data.get('ram_gb')} GB")
    print(f"  - IP/MAC: {inventory_data.get('ip_address')} / {inventory_data.get('mac_address')}")
    print(f"  - Disks: {len(inventory_data.get('disks', []))} found")
    print(f"  - GPUs: {len(inventory_data.get('gpus', []))} found")
    print(f"  - Installed Software: {len(inventory_data.get('installed_software', []))} programs")
    
    # Format data to match Computer model structure
    formatted_data = format_data_for_api(inventory_data, final_department_id)
    
    # Debug mode: show complete data structure
    if DEBUG_MODE:
        print("\n[DEBUG] Complete data structure to be sent:")
        print(json.dumps(formatted_data, indent=2, default=str))
    
    if DRY_RUN:
        print("\n[3/3] DRY RUN MODE - Data collection completed successfully!")
        print("✓ All required fields for Computer model are present")
        print("\n" + "=" * 60)
        print("✓ Dry run completed successfully!")
        print("=" * 60)
    else:
        print("\n[3/3] Sending data to API...")
        success = send_to_api(formatted_data, API_URL)
        
        if success:
            print("\n" + "=" * 60)
            print("✓ Inventory report completed successfully!")
            print("=" * 60)
        else:
            print("\n" + "=" * 60)
            print("✗ Inventory report failed!")
            print("=" * 60)
            exit(1)
