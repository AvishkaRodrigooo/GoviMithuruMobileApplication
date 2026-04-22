import pandas as pd
import numpy as np
import folium
from folium.plugins import HeatMap
import json
import os
from datetime import datetime

class PestHeatmapGenerator:
    """Generate heatmaps of pest occurrences in Sri Lanka"""
    
    def __init__(self):
        # Sri Lanka district coordinates
        self.district_coords = {
            'Anuradhapura': [8.3114, 80.4037],
            'Kurunegala': [7.4867, 80.3647],
            'Polonnaruwa': [7.9403, 81.0188],
            'Hambantota': [6.1241, 81.1185],
            'Colombo': [6.9271, 79.8612],
            'Kandy': [7.2906, 80.6337],
            'Galle': [6.0535, 80.2210],
            'Jaffna': [9.6615, 80.0255],
            'Badulla': [6.9934, 81.0550],
            'Matale': [7.4675, 80.6234],
            'Nuwara Eliya': [6.9497, 80.7891],
            'Ratnapura': [6.7056, 80.3847],
            'Kegalle': [7.2513, 80.3464],
            'Gampaha': [7.0915, 80.0080],
            'Kalutara': [6.5854, 79.9607],
            'Puttalam': [8.0412, 79.8283],
            'Trincomalee': [8.5874, 81.2152],
            'Batticaloa': [7.7100, 81.6924],
            'Ampara': [7.2916, 81.6724],
            'Monaragala': [6.8725, 81.3506]
        }
        
    def generate_heatmap(self, pest_data, pest_name=None, output_path='static/heatmaps'):
        """Generate heatmap from pest occurrence data"""
        
        os.makedirs(output_path, exist_ok=True)
        
        # Prepare data points
        heat_data = []
        
        for _, row in pest_data.iterrows():
            district = row.get('District')
            if district in self.district_coords:
                lat, lon = self.district_coords[district]
                intensity = row.get('Incidence_percent', 50) / 100  # Normalize to 0-1
                heat_data.append([lat, lon, intensity])
        
        # Create base map
        m = folium.Map(
            location=[7.8731, 80.7718],  # Center of Sri Lanka
            zoom_start=8,
            tiles='OpenStreetMap'
        )
        
        # Add heatmap layer
        HeatMap(
            heat_data,
            min_opacity=0.3,
            max_zoom=10,
            radius=25,
            blur=15,
            gradient={0.4: 'blue', 0.65: 'lime', 0.8: 'orange', 1: 'red'}
        ).add_to(m)
        
        # Add district markers
        for district, coords in self.district_coords.items():
            district_data = pest_data[pest_data['District'] == district]
            if not district_data.empty:
                incidence = district_data['Incidence_percent'].mean() if 'Incidence_percent' in district_data.columns else 50
                popup_text = f"""
                <b>{district}</b><br>
                Incidence: {incidence:.1f}%<br>
                Records: {len(district_data)}
                """
            else:
                popup_text = f"<b>{district}</b><br>No data"
            
            folium.Marker(
                coords,
                popup=popup_text,
                icon=folium.Icon(color='green', icon='info-sign')
            ).add_to(m)
        
        # Add title
        title = f'Pest Occurrence Heatmap - {pest_name}' if pest_name else 'Pest Occurrence Heatmap - Sri Lanka'
        title_html = f'''
            <h3 align="center" style="font-size:16px"><b>{title}</b></h3>
        '''
        m.get_root().html.add_child(folium.Element(title_html))
        
        # Save map
        filename = f"heatmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        filepath = os.path.join(output_path, filename)
        m.save(filepath)
        
        return {
            'map_path': filepath,
            'filename': filename,
            'url': f'/static/heatmaps/{filename}',
            'data_points': len(heat_data)
        }
    
    def generate_pest_specific_heatmap(self, pest_name, historical_data):
        """Generate heatmap for specific pest"""
        pest_specific = historical_data[historical_data['Pest'].str.contains(pest_name, na=False)]
        return self.generate_heatmap(pest_specific, pest_name)
    
    def get_heatmap_data(self, historical_data):
        """Get JSON data for React Native map view"""
        heatmap_data = []
        
        for district, coords in self.district_coords.items():
            district_data = historical_data[historical_data['District'] == district]
            if not district_data.empty:
                avg_incidence = district_data['Incidence_percent'].mean() if 'Incidence_percent' in district_data.columns else 0
                pest_counts = district_data['Pest'].value_counts().to_dict() if 'Pest' in district_data.columns else {}
                
                heatmap_data.append({
                    'district': district,
                    'latitude': coords[0],
                    'longitude': coords[1],
                    'incidence': float(avg_incidence),
                    'pest_counts': pest_counts,
                    'total_records': len(district_data)
                })
        
        return heatmap_data

# Singleton instance
heatmap_generator = PestHeatmapGenerator()