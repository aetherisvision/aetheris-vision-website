#!/bin/bash
set -e

# Create directories if they don't exist
mkdir -p public/images/real-estate public/images/wp-editorial public/images/photography

SRC_DIR="/Users/marston.ward/.gemini/antigravity-ide/brain/89f16c78-8720-4197-9165-72a0acd9c0c5"

# Helper function to crop/resize and convert to webp and jpg
process_image() {
  local src_name=$1
  local dest_path=$2
  local width=$3
  local height=$4

  echo "Processing $src_name -> $dest_path ($width x $height)"
  
  local src_file="${SRC_DIR}/${src_name}"
  
  if [ ! -f "$src_file" ]; then
    echo "Warning: Source file $src_file not found!"
    return 1
  fi
  
  # Temporary resized PNG file
  local temp_png="/tmp/temp_${src_name}"
  
  # Resize to exact fill and crop center to fit aspect ratio
  /opt/homebrew/bin/convert "$src_file" -resize "${width}x${height}^" -gravity center -crop "${width}x${height}+0+0" +repage "$temp_png"
  
  # Convert to JPG with high quality
  /opt/homebrew/bin/convert "$temp_png" -quality 85 "${dest_path}.jpg"
  
  # Convert to WebP
  /opt/homebrew/bin/cwebp -q 80 "$temp_png" -o "${dest_path}.webp"
  
  # Clean up temp file
  rm "$temp_png"
}

# 1. Healthcare (800x600)
process_image "dr_whitfield_portrait_1781296349732.png" "public/images/healthcare/healthcare_team_dr-whitfield_800x600" 800 600
process_image "dr_nair_portrait_1781296362094.png" "public/images/healthcare/healthcare_team_dr-nair_800x600" 800 600

# 2. Law Firm (800x600)
process_image "lawyer_mitchell_portrait_1781296373724.png" "public/images/law/law_team_mitchell_800x600" 800 600
process_image "lawyer_torres_portrait_1781296385625.png" "public/images/law/law_team_torres_800x600" 800 600
process_image "lawyer_okonkwo_portrait_1781296397732.png" "public/images/law/law_team_okonkwo_800x600" 800 600

# 3. Real Estate
# Listings (1200x800)
process_image "real_estate_house1_1781296408762.png" "public/images/real-estate/real-estate_card_house1_1200x800" 1200 800
process_image "real_estate_house2_1781296419451.png" "public/images/real-estate/real-estate_card_house2_1200x800" 1200 800
process_image "real_estate_house3_1781296433446.png" "public/images/real-estate/real-estate_card_house3_1200x800" 1200 800
process_image "real_estate_house4_1781296446983.png" "public/images/real-estate/real-estate_card_house4_1200x800" 1200 800
# Agents (800x600)
process_image "broker_thorn_portrait_1781296460006.png" "public/images/real-estate/real-estate_team_thorn_800x600" 800 600
process_image "broker_ellington_portrait_1781296473604.png" "public/images/real-estate/real-estate_team_ellington_800x600" 800 600
process_image "broker_kurosawa_portrait_1781296488037.png" "public/images/real-estate/real-estate_team_kurosawa_800x600" 800 600

# 4. WordPress Editorial (1920x1080)
process_image "editorial_wheat_field_1781296501128.png" "public/images/wp-editorial/wp-editorial_hero_wheat-field_1920x1080" 1920 1080

# 5. Photography Studio
# Gallery (1200x800)
process_image "photography_wedding_1781296514226.png" "public/images/photography/photography_card_wedding_1200x800" 1200 800
process_image "photography_portrait_1781296528035.png" "public/images/photography/photography_card_portrait_1200x800" 1200 800
process_image "photography_commercial_1781296540262.png" "public/images/photography/photography_card_commercial_1200x800" 1200 800
process_image "photography_family_1781296554875.png" "public/images/photography/photography_card_family_1200x800" 1200 800
process_image "photography_editorial_1781296569411.png" "public/images/photography/photography_card_editorial_1200x800" 1200 800
process_image "photography_newborn_1781296583585.png" "public/images/photography/photography_card_newborn_1200x800" 1200 800
# Team & Testimonials (800x600)
process_image "photographer_lumen_portrait_1781296598585.png" "public/images/photography/photography_team_mariahlumen_800x600" 800 600
process_image "photography_testimonial1_1781296610041.png" "public/images/photography/photography_team_testimonial1_800x600" 800 600
process_image "photography_testimonial2_1781296625543.png" "public/images/photography/photography_team_testimonial2_800x600" 800 600
process_image "photography_testimonial3_1781296641754.png" "public/images/photography/photography_team_testimonial3_800x600" 800 600

echo "Image processing completed successfully!"
