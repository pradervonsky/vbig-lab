import os
import re
import time
import uuid
from pathlib import Path
from urllib.parse import urljoin

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from supabase import create_client
from dotenv import load_dotenv

# --------------------------------------------------
# CONFIG
# --------------------------------------------------

load_dotenv()

BASE_URL = "https://public.tableau.com"
SEARCH_URL = "https://public.tableau.com/app/search/vizzes/superstore%20sales?page={page}"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = os.getenv("BUCKET_NAME")

SCREENSHOT_DIR = Path("tmp/screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

# Minimum favorites threshold for a dashboard to be scraped
MIN_FAVORITES = 5

# Page scraping range control
START_PAGE = 1
END_PAGE = 10

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --------------------------------------------------
# SELENIUM SETUP
# --------------------------------------------------

chrome_options = Options()
chrome_options.add_argument("--start-maximized")

driver = webdriver.Chrome(options=chrome_options)
wait = WebDriverWait(driver, 30)

# --------------------------------------------------
# HELPERS
# --------------------------------------------------

# Close the side panel
side_panel_closed = False

def upload_to_supabase(local_file: Path, object_path: str):
    with open(local_file, "rb") as f:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=object_path,
            file=f,
            file_options={
                "content-type": "image/png"
            }
        )

def screenshot_tableau_iframe(output_path: Path):
    global side_panel_closed

    # Wait for iframe
    iframe = wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "#embedded-viz-wrapper iframe")
        )
    )

    # Switch into iframe
    driver.switch_to.frame(iframe)

    # Let Tableau finish rendering
    time.sleep(8)

    # Switch back to main page to close side panel
    driver.switch_to.default_content()

    # Close "Explore Vizzes" side panel (first time only)
    if not side_panel_closed:
        try:
            close_button = WebDriverWait(driver, 1).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Close Side Panel']"))
            )
            close_button.click()
            print("   → Closed side panel")
        except:
            pass
        side_panel_closed = True

    # Switch back into iframe for screenshot
    driver.switch_to.frame(iframe)

    # Screenshot iframe content
    viz_root = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    viz_root.screenshot(str(output_path))

    # Switch back to main page
    driver.switch_to.default_content()

# Extract favorite count from dashboard item
def get_favorite_count(dashboard_item):
    try:
        button = dashboard_item.find_element(By.CSS_SELECTOR, "button[data-tooltip-content*='Favorite']")
        tooltip = button.get_attribute("data-tooltip-content")
        if tooltip:
            match = re.search(r'(\d+)', tooltip)
            if match:
                return int(match.group(1))
    except:
        # Fallback: Parse HTML if button not found
        try:
            item_html = dashboard_item.get_attribute('outerHTML')
            patterns = [
                r'data-tooltip-content="(\d+)\s+Favou?rites?"',
                r'data-tooltip-content=&quot;(\d+)\s+Favou?rites?&quot;',
                r'(\d+)\s+Favou?rites?',
            ]
            for pattern in patterns:
                match = re.search(pattern, item_html)
                if match:
                    return int(match.group(1))
        except:
            pass
    return -1

# --------------------------------------------------
# SCRAPER
# --------------------------------------------------

print(f"\nScraping pages {START_PAGE} to {END_PAGE}")

for page in range(START_PAGE, END_PAGE + 1):
    print(f"\n{'='*60}")
    print(f"PAGE {page}")
    print('='*60)
    
    driver.get(SEARCH_URL.format(page=page))

    # Accept cookies once per session
    try:
        accept_btn = wait.until(
            EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
        )
        accept_btn.click()
        print("✓ Accepted cookies")
    except:
        pass

    # Wait for dashboards list
    wait.until(
        EC.presence_of_element_located((By.CLASS_NAME, "_listContainer_6uimr_22"))
    )

    dashboards = driver.find_elements(By.CLASS_NAME, "_listItem_6uimr_62")
    print(f"✓ Found {len(dashboards)} total dashboards on page")

    # --------------------------------------------------
    # STEP 1: Pre-filter dashboards by favorite count
    # --------------------------------------------------
    
    qualifying_dashboards = []
    
    for index, item in enumerate(dashboards):
        try:
            title_el = item.find_element(By.CLASS_NAME, "_title_1o7u1_130")
            dashboard_name = title_el.text.strip()
            fav_count = get_favorite_count(item)

            status = "✓" if fav_count >= MIN_FAVORITES else "✗"
            print(f"  {status} [{index+1}] {dashboard_name[:50]:<50} | Favorites: {fav_count}")

            if fav_count >= MIN_FAVORITES:
                qualifying_dashboards.append({
                    'index': index,
                    'name': dashboard_name,
                    'favorites': fav_count
                })
        except Exception as e:
            print(f"  ! Error checking dashboard {index}: {e}")
    
    # --------------------------------------------------
    # STEP 2: Process qualifying dashboards
    # --------------------------------------------------
    
    print(f"\n→ {len(qualifying_dashboards)} dashboards meet criteria (≥{MIN_FAVORITES} favorites)")
    
    if len(qualifying_dashboards) == 0:
        print("→ Skipping to next page...\n")
        continue
    
    print(f"→ Processing {len(qualifying_dashboards)} dashboards...\n")
    
    for dash_info in qualifying_dashboards:
        # Re-fetch dashboard list (in case DOM changed)
        dashboards = driver.find_elements(By.CLASS_NAME, "_listItem_6uimr_62")
        item = dashboards[dash_info['index']]
        
        # Extract details
        title_el = item.find_element(By.CLASS_NAME, "_title_1o7u1_130")
        author_el = item.find_element(By.CLASS_NAME, "_author_1o7u1_143")
        
        dashboard_name = title_el.text.strip()
        dashboard_link = urljoin(BASE_URL, title_el.get_attribute("href"))
        dashboard_author = author_el.text.strip()
        
        print(f" Capturing: {dashboard_name}")
        print(f"  Author: {dashboard_author}")
        print(f"  Favorites: {dash_info['favorites']}")
        print(f"  Link: {dashboard_link}")
        
        # Open dashboard
        driver.get(dashboard_link)
        time.sleep(1)

        # Zoom out the entire page to fit the dashboard content better
        driver.execute_script("document.body.style.zoom = '0.85';")

        # Remove navigation bar and marketing banner from DOM
        driver.execute_script("""
            // Remove all navigation bars
            document.querySelectorAll('[class*="_navBar_"], nav, header').forEach(el => el.remove());

            // Remove all marketing banners
            document.querySelectorAll('[class*="_banner_"], [data-testid="marketingBanner"]').forEach(el => el.remove());

            // Remove any remaining top-level navigation elements
            document.querySelectorAll('[class*="_nav_"]').forEach(el => el.remove());
        """)

        # Screenshot
        metadata_id = str(uuid.uuid4())
        local_png = SCREENSHOT_DIR / f"{metadata_id}.png"
        bucket_path = f"screenshots/{metadata_id}.png"

        try:
            screenshot_tableau_iframe(local_png)
            
            # Upload to Supabase
            upload_to_supabase(local_png, bucket_path)
            
            # Insert metadata
            supabase.table("metadata").insert({
                "id": metadata_id,
                "dashboard_name": dashboard_name,
                "dashboard_link": dashboard_link,
                "dashboard_author": dashboard_author,
                "bucket_path": bucket_path,
                "favorite_count": dash_info['favorites']
            }).execute()
            
            print(f"   ✓ Saved to Supabase\n")
            
        except Exception as e:
            print(f"   ✗ Error capturing dashboard: {e}\n")
            
            # Retry once
            try:
                print("   → Retrying...")
                driver.refresh()
                time.sleep(3)
                screenshot_tableau_iframe(local_png)
                upload_to_supabase(local_png, bucket_path)
                supabase.table("metadata").insert({
                    "id": metadata_id,
                    "dashboard_name": dashboard_name,
                    "dashboard_link": dashboard_link,
                    "dashboard_author": dashboard_author,
                    "bucket_path": bucket_path,
                    "favorite_count": dash_info['favorites']
                }).execute()
                print(f"   ✓ Retry successful\n")
            except Exception as retry_error:
                print(f"   ✗ Retry failed: {retry_error}\n")
        
        # Cleanup local file
        local_png.unlink(missing_ok=True)
        
        # Back to search page
        driver.get(SEARCH_URL.format(page=page))
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "_listItem_6uimr_62")))

driver.quit()
print("\n" + "="*60)
print("SCRAPING COMPLETE")
print("="*60)