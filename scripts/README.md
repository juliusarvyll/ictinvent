# ICT Inventory Client Scripts

This directory contains Python scripts for collecting PC hardware and software information and sending it to the ICT Inventory system.

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API URL

Edit `inventory_client.py` and update the `API_URL` variable with your actual server URL:

```python
API_URL = "http://your-server.com/api/inventory/report"
```

For local development:
```python
API_URL = "http://localhost:8000/api/inventory/report"
```

## Usage

### Run the Inventory Client

```bash
python inventory_client.py
```

The script will:
1. Collect system information (CPU, RAM, disks, GPU, installed software, etc.)
2. Display a summary of collected data
3. Send the data to your Laravel API endpoint

### What Data is Collected

- **Hostname**: Computer name
- **Manufacturer & Model**: PC manufacturer and model
- **Serial Number**: BIOS serial number
- **Operating System**: OS name and version
- **CPU**: Processor name
- **RAM**: Total memory in GB
- **Disks**: List of storage devices with model and size
- **GPUs**: Graphics card information
- **IP Address**: Primary IPv4 address
- **Installed Software**: List of installed programs with versions

### Example Output

```json
{
  "hostname": "OFFICE-PC-01",
  "manufacturer": "Dell Inc.",
  "model": "OptiPlex 7080",
  "serial_number": "ABC1234XYZ",
  "os": "Windows 11 Pro",
  "cpu": "Intel(R) Core(TM) i7-9700 CPU @ 3.00GHz",
  "ram_gb": 16.0,
  "disks": [
    {
      "model": "Samsung SSD 970 EVO 500GB",
      "size_gb": 465.76
    }
  ],
  "gpus": [
    "NVIDIA GeForce GTX 1050 Ti"
  ],
  "ip": "192.168.1.45",
  "installed_software": [
    {
      "name": "Google Chrome",
      "version": "122.0.6261.70"
    }
  ]
}
```

## Deployment

### Option 1: Manual Execution
Run the script manually on each PC you want to inventory.

### Option 2: Scheduled Task (Windows)
Create a Windows Scheduled Task to run the script automatically:

1. Open Task Scheduler
2. Create a new task
3. Set trigger (e.g., daily at startup)
4. Set action: `python.exe C:\path\to\inventory_client.py`

### Option 3: Group Policy
Deploy via Group Policy for enterprise environments.

## Troubleshooting

### Permission Errors
Run the script as Administrator to access all system information.

### Network Errors
- Verify the API URL is correct
- Check firewall settings
- Ensure the Laravel server is running

### Missing Dependencies
Install all required packages:
```bash
pip install -r requirements.txt
```

## Security Notes

- The API endpoint `/api/inventory/report` is public (no authentication required)
- Consider adding API token authentication for production use
- Limit installed software collection if privacy is a concern
