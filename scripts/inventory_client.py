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
    info["os"] = f"{platform.system()} {platform.release()}"

    # === CPU ===
    cpu = c.Win32_Processor()[0]
    info["cpu"] = cpu.Name

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
    info["ip"] = None
    for nic in c.Win32_NetworkAdapterConfiguration(IPEnabled=True):
        if nic.IPAddress:
            # Get the first IPv4 address
            for ip in nic.IPAddress:
                if '.' in ip:  # Simple IPv4 check
                    info["ip"] = ip
                    break
            if info["ip"]:
                break

    # === INSTALLED SOFTWARE ===
    info["installed_software"] = get_installed_software()

    return info


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
    
    print("\n[1/3] Collecting system information...")
    try:
        inventory_data = get_inventory()
        print("✓ System information collected successfully")
    except Exception as e:
        print(f"✗ Error collecting system information: {e}")
        exit(1)
    
    print("\n[2/3] Preparing data...")
    print(f"  - Hostname: {inventory_data.get('hostname')}")
    print(f"  - Manufacturer: {inventory_data.get('manufacturer')}")
    print(f"  - Model: {inventory_data.get('model')}")
    print(f"  - CPU: {inventory_data.get('cpu')}")
    print(f"  - RAM: {inventory_data.get('ram_gb')} GB")
    print(f"  - Disks: {len(inventory_data.get('disks', []))} found")
    print(f"  - GPUs: {len(inventory_data.get('gpus', []))} found")
    print(f"  - Installed Software: {len(inventory_data.get('installed_software', []))} programs")
    
    print("\n[3/3] Sending data to API...")
    success = send_to_api(inventory_data, API_URL)
    
    if success:
        print("\n" + "=" * 60)
        print("✓ Inventory report completed successfully!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("✗ Inventory report failed!")
        print("=" * 60)
        exit(1)
