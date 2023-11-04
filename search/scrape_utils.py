import time

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Environment variables to run selenium (website scraper)
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')


def scrape_website_text_from_url(url):
    """Given a URL, return website text"""

    # Open browser & get website contents
    driver = webdriver.Chrome(options=chrome_options)
    driver.get(url)

    # Wait for website to load
    time.sleep(3)

    # Extract the desired information from the page
    html = driver.page_source

    # Use BS4 to parse the HTML
    soup = BeautifulSoup(html, 'html.parser')
    website_text = soup.get_text()

    # Close the browser
    driver.quit()

    return website_text