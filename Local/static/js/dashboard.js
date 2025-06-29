class Dashboard {
  constructor() {
    this.ws = null;
    this.autoScroll = true;
    this.searchQuery = '';
    this.currentFilter = 'all';
    this.stats = {
      totalRequests: 0,
      activeConnections: 0,
      errorCount: 0,
      successCount: 0,
      avgResponseTime: 0
    };
    this.filterCounts = {
      all: 0,
      local: 0,
      proxy: 0,
      server: 0,
      error: 0,
      warn: 0
    };
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.connectWebSocket();
    this.updateStats();
    this.updateFilterCounts();
  }
  
  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = parseInt(window.location.port) + 1; // WebSocket is on next port
    const wsUrl = `${protocol}//${window.location.hostname}:${port}/ws`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      this.updateConnectionStatus(true);
      this.addLog('local', 'Connected to monitor WebSocket');
    };
    
    this.ws.onclose = () => {
      this.updateConnectionStatus(false);
      this.addLog('error', 'Disconnected from monitor WebSocket');
      setTimeout(() => this.connectWebSocket(), 3000);
    };
    
    this.ws.onerror = () => {
      this.addLog('error', 'WebSocket connection error');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }
  
  handleMessage(data) {
    switch (data.type) {
      case 'log':
        this.addLog(data.kind, data.message, data.timestamp);
        break;
      case 'stats':
        this.updateStatsData(data.stats);
        break;
      case 'request':
        this.handleRequest(data);
        break;
      case 'response':
        this.handleResponse(data);
        break;
    }
  }
  
  handleRequest(data) {
    this.stats.totalRequests++;
    this.stats.activeConnections++;
    this.updateStats();
    
    const message = this.formatRequestMessage(data);
    this.addLog('server', message);
  }
  
  handleResponse(data) {
    this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
    
    if (data.statusCode >= 400) {
      this.stats.errorCount++;
    } else if (data.statusCode >= 200 && data.statusCode < 300) {
      this.stats.successCount++;
    }
    
    if (data.responseTime) {
      this.updateAverageResponseTime(data.responseTime);
    }
    
    this.updateStats();
    
    const message = this.formatResponseMessage(data);
    this.addLog('server', message);
  }
  
  formatRequestMessage(data) {
    const method = `<span class="request-method method-${data.method.toLowerCase()}">${data.method}</span>`;
    const url = `<span class="request-url"><span class="path">${data.url}</span></span>`;
    const id = `<span class="request-id">[${data.requestId.substring(0, 8)}]</span>`;
    return `${method} ${url} ${id}`;
  }
  
  formatResponseMessage(data) {
    const statusClass = this.getStatusClass(data.statusCode);
    const status = `<span class="status-code ${statusClass}">${data.statusCode}</span>`;
    const method = `<span class="request-method method-${data.method.toLowerCase()}">${data.method}</span>`;
    const url = `<span class="request-url"><span class="path">${data.url}</span></span>`;
    const id = `<span class="request-id">[${data.requestId.substring(0, 8)}]</span>`;
    const time = data.responseTime ? `<span class="response-time">${data.responseTime}ms</span>` : '';
    return `${status} ${method} ${url} ${id} ${time}`;
  }
  
  getStatusClass(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return 'status-2xx';
    if (statusCode >= 300 && statusCode < 400) return 'status-3xx';
    if (statusCode >= 400 && statusCode < 500) return 'status-4xx';
    if (statusCode >= 500) return 'status-5xx';
    return '';
  }
  
  addLog(kind, message, timestamp = null) {
    const logsContainer = document.getElementById('logs-content');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${kind}`;
    
    const time = timestamp ? new Date(timestamp) : new Date();
    const timeStr = time.toTimeString().split(' ')[0];
    
    logEntry.innerHTML = `
      <span class="log-timestamp">${timeStr}</span>
      <span class="log-kind ${kind}">${kind}</span>
      <span class="log-message">${message}</span>
      <div class="log-actions">
        <button class="log-action" onclick="dashboard.copyLog(this)" title="Copy">📋</button>
        <button class="log-action" onclick="dashboard.highlightLog(this)" title="Highlight">✨</button>
      </div>
    `;
    
    // Update filter counts
    this.filterCounts[kind]++;
    this.filterCounts.all++;
    this.updateFilterCounts();
    
    // Apply current filter and search
    if (!this.shouldShowLog(logEntry, kind, message)) {
      logEntry.classList.add('hidden');
    }
    
    logsContainer.appendChild(logEntry);
    
    // Keep only last 2000 entries
    const entries = logsContainer.children;
    if (entries.length > 2000) {
      const removedEntry = entries[0];
      const removedKind = removedEntry.classList[1];
      this.filterCounts[removedKind]--;
      this.filterCounts.all--;
      logsContainer.removeChild(removedEntry);
    }
    
    // Auto scroll to bottom
    if (this.autoScroll) {
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }
  
  shouldShowLog(entry, kind, message) {
    // Filter check
    if (this.currentFilter !== 'all' && this.currentFilter !== kind) {
      return false;
    }
    
    // Search check
    if (this.searchQuery && !message.toLowerCase().includes(this.searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  }
  
  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (connected) {
      statusElement.textContent = 'Connected';
      statusElement.className = 'status-indicator status-connected';
    } else {
      statusElement.textContent = 'Disconnected';
      statusElement.className = 'status-indicator status-disconnected';
    }
  }
  
  updateStats() {
    document.getElementById('total-requests').textContent = this.formatNumber(this.stats.totalRequests);
    document.getElementById('active-connections').textContent = this.formatNumber(this.stats.activeConnections);
    document.getElementById('error-count').textContent = this.formatNumber(this.stats.errorCount);
    document.getElementById('success-count').textContent = this.formatNumber(this.stats.successCount);
    document.getElementById('avg-response-time').textContent = `${Math.round(this.stats.avgResponseTime)}ms`;
  }
  
  updateStatsData(stats) {
    this.stats = { ...this.stats, ...stats };
    this.updateStats();
  }
  
  updateAverageResponseTime(responseTime) {
    if (this.stats.avgResponseTime === 0) {
      this.stats.avgResponseTime = responseTime;
    } else {
      this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
    }
  }
  
  updateFilterCounts() {
    Object.keys(this.filterCounts).forEach(filter => {
      const chip = document.querySelector(`[data-filter="${filter}"]`);
      if (chip) {
        const countElement = chip.querySelector('.count');
        if (countElement) {
          countElement.textContent = this.filterCounts[filter];
        }
      }
    });
  }
  
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  setupEventListeners() {
    // Clear logs
    document.getElementById('clear-logs')?.addEventListener('click', () => {
      this.clearLogs();
    });
    
    // Auto scroll toggle
    document.getElementById('toggle-auto-scroll')?.addEventListener('click', (e) => {
      this.autoScroll = !this.autoScroll;
      e.target.textContent = `Auto Scroll: ${this.autoScroll ? 'ON' : 'OFF'}`;
      e.target.classList.toggle('active', this.autoScroll);
    });
    
    // Search
    document.getElementById('logs-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.applyFilters();
    });
    
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.setFilter(chip.dataset.filter);
      });
    });
    
    // Export logs
    document.getElementById('export-logs')?.addEventListener('click', () => {
      this.exportLogs();
    });
  }
  
  clearLogs() {
    document.getElementById('logs-content').innerHTML = '';
    this.stats = {
      totalRequests: 0,
      activeConnections: 0,
      errorCount: 0,
      successCount: 0,
      avgResponseTime: 0
    };
    this.filterCounts = {
      all: 0,
      local: 0,
      proxy: 0,
      server: 0,
      error: 0,
      warn: 0
    };
    this.updateStats();
    this.updateFilterCounts();
  }
  
  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active filter chip
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    
    this.applyFilters();
  }
  
  applyFilters() {
    const entries = document.querySelectorAll('.log-entry');
    entries.forEach(entry => {
      const kind = entry.classList[1];
      const message = entry.querySelector('.log-message').textContent;
      
      if (this.shouldShowLog(entry, kind, message)) {
        entry.classList.remove('hidden');
      } else {
        entry.classList.add('hidden');
      }
    });
  }
  
  copyLog(button) {
    const entry = button.closest('.log-entry');
    const timestamp = entry.querySelector('.log-timestamp').textContent;
    const kind = entry.querySelector('.log-kind').textContent;
    const message = entry.querySelector('.log-message').textContent;
    const logText = `[${timestamp}] ${kind.toUpperCase()}: ${message}`;
    
    navigator.clipboard.writeText(logText).then(() => {
      this.showToast('Log copied to clipboard');
    });
  }
  
  highlightLog(button) {
    const entry = button.closest('.log-entry');
    entry.style.background = 'var(--warning-bg)';
    entry.style.borderLeft = '3px solid var(--warning)';
    
    setTimeout(() => {
      entry.style.background = '';
      entry.style.borderLeft = '';
    }, 2000);
  }
  
  exportLogs() {
    const entries = document.querySelectorAll('.log-entry:not(.hidden)');
    let logData = '';
    
    entries.forEach(entry => {
      const timestamp = entry.querySelector('.log-timestamp').textContent;
      const kind = entry.querySelector('.log-kind').textContent;
      const message = entry.querySelector('.log-message').textContent;
      logData += `[${timestamp}] ${kind.toUpperCase()}: ${message}\n`;
    });
    
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tunnel-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Logs exported successfully');
  }
  
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      z-index: var(--z-tooltip);
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
}

// Global dashboard instance
let dashboard;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new Dashboard();
});
