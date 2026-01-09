class FertilizerRecommender:
    def __init__(self):
        # Simplified recommendations
        self.recommendations = {
            "Brown Planthopper (BPH)": "Apply Buprofezin 25 SC @ 600 ml/ha. Reduce nitrogen fertilizer by 30%.",
            "Rice Leaf-folder": "Apply Chlorantraniliprole 18.5 SC @ 150 ml/ha. Use balanced NPK.",
            "Sheath Blight": "Apply Hexaconazole 5 EC @ 1000 ml/ha. Reduce nitrogen, increase Potash.",
            "Rice Gall Midge": "Use resistant varieties. Apply Carbofuran 3 G @ 33 kg/ha at planting.",
            "Paddy Bug": "Apply Neem oil 5%. Maintain clean field bunds.",
            "General": "Monitor regularly. Maintain balanced nutrition and field hygiene."
        }
    
    def recommend(self, pest_name, severity):
        """Generate simple fertilizer recommendation"""
        recommendation = self.recommendations.get(pest_name, self.recommendations["General"])
        
        # Adjust based on severity
        if severity == "High":
            recommendation += " Take immediate action. Consider professional consultation."
        elif severity == "Moderate":
            recommendation += " Monitor closely and apply preventive measures."
        
        return {
            "recommendation": recommendation,
            "immediate_action": "Apply recommended pesticide",
            "preventive": "Maintain field hygiene, proper spacing",
            "organic_option": "Consider neem-based products as alternative"
        }

# Global instance
recommender = FertilizerRecommender()