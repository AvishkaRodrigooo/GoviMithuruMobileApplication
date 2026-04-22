
import os

pestdata_path = "dataset/pestdata"

print(f" Checking pest data at: {pestdata_path}")
print("\n Contents:")

if not os.path.exists(pestdata_path):
    print(f" Folder not found: {pestdata_path}")
else:
    
    for item in os.listdir(pestdata_path):
        item_path = os.path.join(pestdata_path, item)
        if os.path.isdir(item_path):
            print(f"\n {item}/")
         
            try:
                files = os.listdir(item_path)[:5]
                for f in files:
                    print(f"    {f}")
                if len(os.listdir(item_path)) > 5:
                    print(f"   ... and {len(os.listdir(item_path))-5} more")
            except:
                pass
        else:
            print(f" {item}")

    # Check if it's in YOLO format
    print("\n🔍 Checking for YOLO format...")
    for split in ['train', 'valid', 'test']:
        split_path = os.path.join(pestdata_path, split)
        if os.path.exists(split_path):
            images_path = os.path.join(split_path, 'images')
            labels_path = os.path.join(split_path, 'labels')
            
            if os.path.exists(images_path):
                img_count = len(os.listdir(images_path))
                print(f" {split}/images: {img_count} files")
            if os.path.exists(labels_path):
                lbl_count = len(os.listdir(labels_path))
                print(f" {split}/labels: {lbl_count} files")