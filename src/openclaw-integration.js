/**
 * OpenClaw Integration Module
 * Connects Automation Hub to OpenClaw Gateway for:
 * - Sending notifications (Telegram, WhatsApp, etc.)
 * - Running agent tasks with context
 * - Reading calendar/emails via OpenClaw tools
 */

const http = require('http');
const https = require('https');

class OpenClawIntegration {
  constructor(config = {}) {
    this.gatewayUrl = config.gatewayUrl || 'http://127.0.0.1:18789';
    this.apiKey = config.apiKey || null;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Send notification to any OpenClaw channel
   */
  async sendNotification(channel, message, options = {}) {
    const payload = {
      action: 'send',
      channel,
      message,
      ...options
    };

    return await this._gatewayRequest('/message', payload);
  }

  /**
   * Run an agent task with custom prompt
   */
  async runAgent(prompt, model = 'claude-opus-4-5', context = {}) {
    const payload = {
      action: 'agent',
      message: prompt,
      model,
      context
    };

    return await this._gatewayRequest('/agent', payload);
  }

  /**
   * Check calendar for events
   */
  async getCalendarEvents(from, to) {
    // Via OpenClaw tools - calendar integration would go here
    // For now, return mock data structure
    return {
      events: [],
      source: 'calendar',
      from,
      to
    };
  }

  /**
   * Check emails (IMAP integration)
   */
  async getEmails(folder = 'INBOX', limit = 10) {
    // Via OpenClaw tools - email integration would go here
    return {
      emails: [],
      folder,
      count: 0
    };
  }

  /**
   * Make request to OpenClaw Gateway
   */
  async _gatewayRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.gatewayUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        timeout: this.timeout
      };

      const req = (url.protocol === 'https' ? https : http).request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (e) {
            resolve({ raw: body, status: res.statusCode });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Gateway request timeout'));
      });

      req.write(JSON.stringify(data));
      req.end();
    });
  }

  /**
   * Check if Gateway is reachable
   */
  async healthCheck() {
    try {
      await this._gatewayRequest('/health', {});
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = OpenClawIntegration;
