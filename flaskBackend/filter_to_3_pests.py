# filter_to_3_pests.py
import os
import shutil
import yaml

# Your 3 target pests
TARGET_PESTS = [
    'Brown Planthopper (BPH)',    # from class 0
    'Rice Leaf-folder',           # from class 2
    'Paddy Bug'                    # from class 3
]

# Mapping from dataset classes to target indices
CLASS_MAPPING = {
    0: 0,  # brown-planthopper -> Brown Planthopper (BPH)
    2: 1,  # leaf-folder -> Rice Leaf-folder
    3: 2,  # rice-bug -> Paddy Bug
}

print("🎯 Creating dataset with 3 target classes:")
for i, name in enumerate(TARGET_PESTS):
    print(f"   {i}: {name}")

def filter_dataset():
    """Filter dataset to keep only the 3 target pests"""
    
    # Create output directory
    output_dir = 'dataset/pestdata_3classes'
    os.makedirs(output_dir, exist_ok=True)
    
    # Statistics
    stats = {0:0, 1:0, 2:0}
    total_filtered = 0
    
    # Process each split
    for split in ['train', 'valid', 'test']:
        print(f"\n🔄 Processing {split}...")
        
        src_img_dir = f'dataset/pestdata/{split}/images'
        src_label_dir = f'dataset/pestdata/{split}/labels'
        
        dst_img_dir = f'{output_dir}/images/{split}'
        dst_label_dir = f'{output_dir}/labels/{split}'
        
        os.makedirs(dst_img_dir, exist_ok=True)
        os.makedirs(dst_label_dir, exist_ok=True)
        
        # Get all label files
        label_files = [f for f in os.listdir(src_label_dir) if f.endswith('.txt')]
        
        split_filtered = 0
        for label_file in label_files:
            # Read labels
            with open(os.path.join(src_label_dir, label_file), 'r') as f:
                lines = f.readlines()
            
            # Filter and remap
            new_lines = []
            for line in lines:
                parts = line.strip().split()
                if not parts:
                    continue
                
                old_class = int(parts[0])
                if old_class in CLASS_MAPPING:
                    new_class = CLASS_MAPPING[old_class]
                    new_line = f"{new_class} {' '.join(parts[1:])}\n"
                    new_lines.append(new_line)
                    stats[new_class] += 1
            
            # Save if any target pests found
            if new_lines:
                # Copy image
                for ext in ['.jpg', '.jpeg', '.png']:
                    img_file = label_file.replace('.txt', ext)
                    if os.path.exists(os.path.join(src_img_dir, img_file)):
                        shutil.copy(
                            os.path.join(src_img_dir, img_file),
                            os.path.join(dst_img_dir, img_file)
                        )
                        break
                
                # Save filtered labels
                with open(os.path.join(dst_label_dir, label_file), 'w') as f:
                    f.writelines(new_lines)
                
                split_filtered += 1
        
        print(f"  ✅ {split}: {split_filtered} images")
        total_filtered += split_filtered
    
    # Create data.yaml for 3 classes
    new_data = {
        'path': './dataset/pestdata_3classes',
        'train': 'images/train',
        'val': 'images/valid',
        'test': 'images/test',
        'nc': 3,
        'names': TARGET_PESTS
    }
    
    with open(f'{output_dir}/data.yaml', 'w') as f:
        yaml.dump(new_data, f, default_flow_style=False)
    
    # Print summary
    print(f"\n📊 Class distribution:")
    for class_id, count in stats.items():
        print(f"   {TARGET_PESTS[class_id]}: {count} instances")
    
    print(f"\n✅ Filtered dataset created at: {output_dir}")
    print(f"   Total images: {total_filtered}")
    print(f"   Classes: {len(TARGET_PESTS)}")
    
    return total_filtered

if __name__ == "__main__":
    filter_dataset()