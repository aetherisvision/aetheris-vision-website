#!/bin/bash

# Portfolio Image Download Script
# Downloads professional stock photos for each portfolio demo

set -e

# Base directory
IMAGE_DIR="/Users/marston.ward/Documents/GitHub/website/public/images"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📸 Portfolio Image Downloader${NC}"
echo -e "Downloading professional stock photos for portfolio demos...\n"

# Function to download image with retry
download_image() {
    local url="$1"
    local output="$2"
    local description="$3"
    
    echo -e "${YELLOW}⬇️  Downloading: ${description}${NC}"
    
    if curl -f -o "$output" "$url" 2>/dev/null; then
        local size=$(du -h "$output" | cut -f1)
        echo -e "${GREEN}✅ Success: ${output} (${size})${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed: ${description}${NC}"
        return 1
    fi
}

# Law firm images (PREMIUM QUALITY)
echo -e "\n${BLUE}⚖️  Law Firm Demo Images (Premium)${NC}"
cd "$IMAGE_DIR/law"

download_image \
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop&crop=center&q=80" \
    "law_hero_courthouse-premium_1920x1080.jpg" \
    "Professional courthouse exterior"

download_image \
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center&q=80" \
    "law_card_books-premium_400x300.jpg" \
    "Legal books with professional lighting"

download_image \
    "https://images.unsplash.com/photo-1436450412740-6b988f486c6b?w=400&h=300&fit=crop&crop=center&q=80" \
    "law_card_scales-premium_400x300.jpg" \
    "Scales of justice"

download_image \
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&crop=center&q=80" \
    "law_interior_office_800x600.jpg" \
    "Professional law office interior"

download_image \
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&crop=center&q=80" \
    "law_team_professional_800x600.jpg" \
    "Professional legal team"

# Contractor Images  
echo -e "\n${BLUE}🔨 Contractor Demo Images${NC}"
cd "$IMAGE_DIR/contractor"

download_image \
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&h=1080&fit=crop&crop=center" \
    "contractor_hero_construction_1920x1080.jpg" \
    "Modern construction site"

download_image \
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&h=600&fit=crop&crop=center" \
    "contractor_team_workers_800x600.jpg" \
    "Professional construction team"

download_image \
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center" \
    "contractor_tools_professional_400x300.jpg" \
    "Organized construction tools"

# Healthcare Images
echo -e "\n${BLUE}🏥 Healthcare Demo Images${NC}"
cd "$IMAGE_DIR/healthcare"

download_image \
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1920&h=1080&fit=crop&crop=center" \
    "healthcare_hero_clinic_1920x1080.jpg" \
    "Modern medical clinic"

download_image \
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=600&fit=crop&crop=center" \
    "healthcare_team_doctors_800x600.jpg" \
    "Medical professionals"

# Tech/Analytics Images
echo -e "\n${BLUE}💻 Tech/Analytics Demo Images${NC}"
cd "$IMAGE_DIR/analytics"

download_image \
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center" \
    "analytics_hero_dashboard_1920x1080.jpg" \
    "Data analytics dashboard"

download_image \
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center" \
    "analytics_charts_data_800x600.jpg" \
    "Business charts and data"

# International Market Images
echo -e "\n${BLUE}🌍 International Market Images${NC}"
cd "$IMAGE_DIR/international"

download_image \
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=1080&fit=crop&crop=center" \
    "international_hero_market_1920x1080.jpg" \
    "International food market"

download_image \
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center" \
    "international_spices_colorful_400x300.jpg" \
    "Colorful international spices"

# Summary
echo -e "\n${GREEN}🎉 Download Complete!${NC}"
echo -e "${BLUE}📊 Summary:${NC}"

for category in law restaurant contractor healthcare analytics international; do
    if [ -d "$IMAGE_DIR/$category" ]; then
        count=$(ls -1 "$IMAGE_DIR/$category"/*.jpg 2>/dev/null | wc -l || echo 0)
        size=$(du -sh "$IMAGE_DIR/$category" 2>/dev/null | cut -f1 || echo "0K")
        echo -e "  ${category}: ${count} images (${size})"
    fi
done

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo "1. Update portfolio demos to use PortfolioImage components"
echo "2. Test image loading and optimization"  
echo "3. Consider WebP conversion for better performance"
echo "4. Add more images as needed for specific demos"

echo -e "\n${GREEN}✨ Ready to enhance your portfolio visuals!${NC}"