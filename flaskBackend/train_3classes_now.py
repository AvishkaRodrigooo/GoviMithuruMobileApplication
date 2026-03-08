from ultralytics import YOLO
import torch
import os
import shutil
from datetime import datetime
import yaml

# Get the current working directory
current_dir = os.getcwd()
print(f" Current directory: {current_dir}")


data_yaml = os.path.join(current_dir, 'dataset', 'pestdata_3classes', 'data.yaml')

# Update the data.yaml file with correct paths
with open(data_yaml, 'r') as f:
    data_config = yaml.safe_load(f)

# Update paths to absolute paths
data_config['path'] = os.path.join(current_dir, 'dataset', 'pestdata_3classes')
data_config['train'] = 'images/train'
data_config['val'] = 'images/valid'
data_config['test'] = 'images/test'

# Save the fixed data.yaml
with open(data_yaml, 'w') as f:
    yaml.dump(data_config, f, default_flow_style=False)

print(f"\n Dataset Configuration:")
print(f"   Path: {data_config['path']}")
print(f"   Train: {data_config['train']}")
print(f"   Val: {data_config['val']}")

# Verify paths exist
train_path = os.path.join(data_config['path'], 'images', 'train')
valid_path = os.path.join(data_config['path'], 'images', 'valid')

if os.path.exists(train_path):
    train_images = len(os.listdir(train_path))
    print(f"    Train images found: {train_images}")
else:
    print(f"    Train path not found: {train_path}")

if os.path.exists(valid_path):
    valid_images = len(os.listdir(valid_path))
    print(f"    Valid images found: {valid_images}")
else:
    print(f"    Valid path not found: {valid_path}")

print("="*60)
print(" PEST DETECTION TRAINING")
print("="*60)

# Target epochs
TOTAL_EPOCHS_DESIRED = 25

# Check for existing training
resume_path = 'runs/train/pest_3class_fixed/weights/last.pt'
model_path = 'runs/train/pest_3class_fixed/weights/best.pt'

if os.path.exists(resume_path):
    print(f" Found existing training!")
    
    # Try to determine current epoch from the last.pt file
    try:
       
        checkpoint = torch.load(resume_path, map_location='cpu')
        current_epoch = checkpoint.get('epoch', 0)
        if current_epoch is None:
            current_epoch = 0
        print(f"   Current epoch: {current_epoch}")
    except:
        # If can't load checkpoint, ask user or assume based on your logs
        print("    Could not determine current epoch from checkpoint")
        current_epoch = 26  # Based on your logs showing epoch 26
        print(f"   Assuming current epoch: {current_epoch} (from training logs)")
    
    # Calculate remaining epochs
    remaining_epochs = TOTAL_EPOCHS_DESIRED - current_epoch
    
    if remaining_epochs <= 0:
        print(f" Training already completed {current_epoch}/{TOTAL_EPOCHS_DESIRED} epochs!")
        print(f"   No additional training needed.")
        model = YOLO(resume_path)
    else:
        print(f" Need to train for {remaining_epochs} more epochs to reach {TOTAL_EPOCHS_DESIRED}")
        print(f"   Loading from: {resume_path}")
        model = YOLO(resume_path)
        
   
        start_time = datetime.now()
        print(f" Training resumed at: {start_time.strftime('%H:%M:%S')}")
        print(f" Current epoch: {current_epoch}/{TOTAL_EPOCHS_DESIRED}")
        
        print(f"\n Training will continue for {remaining_epochs} more epochs...")
        print(f"   You can monitor progress in: runs/train/pest_3class_fixed/")
        
       
        results = model.train(
            data=data_yaml,
            epochs=remaining_epochs,  
            imgsz=416,
            batch=32,
            workers=4,
            cache=True,
            device='cpu',
            augment=True,
            mosaic=0.3,
            patience=15,
            save=True,
            plots=True,
            name='pest_3class_fixed',
            exist_ok=True,
            verbose=True,
            project='runs/train',
            resume=False  
        )
else:
    print(f" No existing training found, starting fresh...")
    model = YOLO('yolov8n.pt')
    current_epoch = 0
    
 
    start_time = datetime.now()
    print(f" Training started at: {start_time.strftime('%H:%M:%S')}")
    print(f" Training for {TOTAL_EPOCHS_DESIRED} epochs...")
    
    # Train from scratch
    results = model.train(
        data=data_yaml,
        epochs=TOTAL_EPOCHS_DESIRED,
        imgsz=416,
        batch=32,
        workers=4,
        cache=True,
        device='cpu',
        augment=True,
        mosaic=0.3,
        patience=15,
        save=True,
        plots=True,
        name='pest_3class_fixed',
        exist_ok=True,
        verbose=True,
        project='runs/train',
        resume=False
    )


end_time = datetime.now()
duration = end_time - start_time if 'start_time' in locals() else datetime.now() - datetime.now()
print(f"\n Training completed at: {end_time.strftime('%H:%M:%S')}")
if 'start_time' in locals():
    print(f"⏱ Total duration: {duration}")

# Save model
best_model = 'runs/train/pest_3class_fixed/weights/best.pt'
if os.path.exists(best_model):
    os.makedirs('models', exist_ok=True)
    
    # Save with date
    date_str = datetime.now().strftime("%Y%m%d")
    model_path = f'models/pest_3class_{date_str}.pt'
    shutil.copy(best_model, model_path)
    shutil.copy(best_model, 'models/pest_3class.pt')
    
    print(f"\n Model saved to:")
    print(f"   - models/pest_3class.pt")
    print(f"   - {model_path}")
    
    # Also save a copy in the current directory
    shutil.copy(best_model, 'pest_model.pt')
    print(f"   - pest_model.pt (in current folder)")
else:
    print(f"\n Best model not found at: {best_model}")

# Validate if model exists
if os.path.exists('models/pest_3class.pt'):
    print(f"\n Running validation...")
    model = YOLO('models/pest_3class.pt')
    metrics = model.val(data=data_yaml)
    
    print(f"\n Final Results ({TOTAL_EPOCHS_DESIRED} epochs):")
    print(f"   mAP50: {metrics.box.map50:.3f}")
    print(f"   mAP50-95: {metrics.box.map:.3f}")
    
    # Print per-class results if available
    if hasattr(metrics, 'ap_class_index') and hasattr(metrics, 'class_result'):
        print(f"\n Per-class Results:")
        for i, class_name in enumerate(metrics.names.values()):
            if i < len(metrics.class_result):
                ap50 = metrics.class_result[i][0]  # AP50 for class i
                print(f"   {class_name}: mAP50 = {ap50:.3f}")
else:
    print(f"\n Model not found for validation")

print("\n" + "="*60)
print(" TRAINING COMPLETE!")
print("="*60)
print("\n Your model is at: models/pest_3class.pt")