
import yaml
import os
from collections import Counter


with open('dataset/pestdata/data.yaml', 'r') as f:
    data = yaml.safe_load(f)

print(" Current classes in your dataset:")
for i, class_name in enumerate(data.get('names', [])):
    print(f"  {i}: {class_name}")

# Count instances per class
label_dir = 'dataset/pestdata/train/labels'
class_counts = Counter()

for label_file in os.listdir(label_dir):
    with open(os.path.join(label_dir, label_file), 'r') as f:
        for line in f:
            class_id = int(line.strip().split()[0])
            class_counts[class_id] += 1

print("\n Class distribution:")
total_instances = sum(class_counts.values())
for class_id, count in sorted(class_counts.items()):
    class_name = data['names'][class_id] if class_id < len(data['names']) else f"Unknown-{class_id}"
    percentage = (count / total_instances) * 100
    print(f"  {class_name}: {count} instances ({percentage:.1f}%)")