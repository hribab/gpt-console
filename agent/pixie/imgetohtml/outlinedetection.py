import cv2
import numpy as np
import json
from matplotlib import pyplot as plt

# Load the image
img_color = cv2.imread('webdesign.png')
img = cv2.imread('webdesign.png', cv2.IMREAD_GRAYSCALE)

# Apply Gaussian blur
blurred = cv2.GaussianBlur(img, (5, 5), 0)

# Edge detection
edges = cv2.Canny(blurred, 30, 100)

# Find contours
contours, _ = cv2.findContours(edges.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Area threshold for an object to be considered valid
area_threshold = 500

# Convert hexadecimal color to RGB
hex_color = "202124"
background_color_rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

# Convert RGB to grayscale
background_color_gray = int(0.2989 * background_color_rgb[0] + 0.5870 * background_color_rgb[1] + 0.1140 * background_color_rgb[2])

# Width threshold for an object to be classified as an "input"
width_threshold = 50

# Classify objects based on the conditions and area threshold
classified_objects = []
for i, contour in enumerate(contours):
    x, y, w, h = cv2.boundingRect(contour)
    
    # If the area is greater than the threshold, classify the object
    if w * h > area_threshold:
        # Crop the region of the object from the grayscale image
        obj_region = img[y:y+h, x:x+w]
        obj_region_color = img_color[y:y+h, x:x+w]

        # If the average pixel intensity in the object region is close to the background color, classify the object as an "input"
        if np.abs(np.mean(obj_region) - background_color_gray) < 50:  # Allow some tolerance
            obj_type = 'input'
        else:
            obj_type = 'non-input'
        
        # Calculate the average color of the object
        avg_color_per_row = np.average(obj_region_color, axis=0)
        avg_color = np.average(avg_color_per_row, axis=0)
        
        # Add the object type to the object data
        obj_data = {
            'x': int(x),
            'y': int(y),
            'width': int(w),
            'height': int(h),
            'type': obj_type
        }
        
        # Draw the contours and the object name on the original image
        cv2.drawContours(img_color, [contour], -1, (0, 255, 0), 3)
        cv2.putText(img_color, f'object{i + 1}', (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        classified_objects.append({f'object{i + 1}': obj_data})

# Display the image with object names
plt.imshow(cv2.cvtColor(img_color, cv2.COLOR_BGR2RGB))
plt.show()

# Save the image
output_image_path = 'output.png'
cv2.imwrite(output_image_path, cv2.cvtColor(img_color, cv2.COLOR_RGB2BGR))

# Define data to be written
data = {"canvas": classified_objects}

# Specify the JSON file path
json_file_path = "contour_data.json"

# Write data to a JSON file
with open(json_file_path, 'w') as json_file:
    json.dump(data, json_file)

print(json_file_path)



# # Create HTML content
# html_content = "<!DOCTYPE html>\n<html>\n<body>\n"
# for obj in classified_objects:
#     obj_name = list(obj.keys())[0]
#     obj_data = obj[obj_name]
#     html_content += f'<div style="position: absolute; left: {obj_data["x"]}px; top: {obj_data["y"]}px; width: {obj_data["width"]}px; height: {obj_data["height"]}px; background-color: {obj_data["type"]};">{obj_name}</div>\n'
# html_content += "</body>\n</html>"

# # Specify the HTML file path
# html_file_path = "output.html"

# # Write the HTML content to a file
# with open(html_file_path, 'w') as html_file:
#     html_file.write(html_content)

# print(html_file_path)