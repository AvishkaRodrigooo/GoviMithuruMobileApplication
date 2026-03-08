import os

# List contents of current directory
print("Current directory:", os.getcwd())
print("\n Files and folders here:")
for item in os.listdir('.'):
    if os.path.isdir(item):
        print(f" {item}")
    else:
        print(f" {item}")

# Also check if  dataset folder is in parent directory
print("\n Looking for dataset folders...")
for root, dirs, files in os.walk('.'):
    for dir_name in dirs:
        if 'pest' in dir_name.lower() or 'rice' in dir_name.lower() or 'dataset' in dir_name.lower():
            print(f"Found: {os.path.join(root, dir_name)}")