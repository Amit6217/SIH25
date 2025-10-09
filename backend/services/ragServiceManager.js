const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class RAGServiceManager {
  constructor() {
    this.process = null;
    this.isRunning = false;
    this.port = process.env.RAG_SERVICE_PORT || 8000;
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.ragServicePath = path.join(__dirname, '../../sih_rag');
    this.mainScript = process.env.RAG_MAIN_SCRIPT || 'main_simple.py';
  }

  /**
   * Start the RAG service as a subprocess
   */
  async startRAGService() {
    if (this.isRunning) {
      console.log('RAG service is already running');
      return true;
    }

    try {
      const scriptPath = path.join(this.ragServicePath, this.mainScript);
      
      // Check if the script exists
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`RAG script not found: ${scriptPath}`);
      }

      console.log(`Starting RAG service: ${scriptPath}`);
      
      // Set environment variables for the Python process
      const env = {
        ...process.env,
        PORT: this.port.toString(),
        PYTHONPATH: this.ragServicePath
      };

      // Start the Python process
      this.process = spawn(this.pythonPath, [scriptPath], {
        cwd: this.ragServicePath,
        env: env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Handle process events
      this.process.stdout.on('data', (data) => {
        console.log(`RAG Service: ${data.toString().trim()}`);
      });

      this.process.stderr.on('data', (data) => {
        console.error(`RAG Service Error: ${data.toString().trim()}`);
      });

      this.process.on('close', (code) => {
        console.log(`RAG service process exited with code ${code}`);
        this.isRunning = false;
        this.process = null;
      });

      this.process.on('error', (error) => {
        console.error('Failed to start RAG service:', error);
        this.isRunning = false;
        this.process = null;
      });

      // Wait a bit for the service to start
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      this.isRunning = true;
      console.log(`RAG service started on port ${this.port}`);
      return true;

    } catch (error) {
      console.error('Error starting RAG service:', error);
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Stop the RAG service
   */
  async stopRAGService() {
    if (!this.isRunning || !this.process) {
      console.log('RAG service is not running');
      return true;
    }

    try {
      console.log('Stopping RAG service...');
      this.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        this.process.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.isRunning = false;
      this.process = null;
      console.log('RAG service stopped');
      return true;

    } catch (error) {
      console.error('Error stopping RAG service:', error);
      return false;
    }
  }

  /**
   * Restart the RAG service
   */
  async restartRAGService() {
    await this.stopRAGService();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return await this.startRAGService();
  }

  /**
   * Check if RAG service is running
   */
  isServiceRunning() {
    return this.isRunning && this.process && !this.process.killed;
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      script: this.mainScript,
      pid: this.process ? this.process.pid : null
    };
  }

  /**
   * Install Python dependencies
   */
  async installDependencies() {
    try {
      const requirementsPath = path.join(this.ragServicePath, 'requirements_simple.txt');
      
      if (!fs.existsSync(requirementsPath)) {
        throw new Error(`Requirements file not found: ${requirementsPath}`);
      }

      console.log('Installing Python dependencies...');
      
      return new Promise((resolve, reject) => {
        const pipProcess = spawn(this.pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath], {
          cwd: this.ragServicePath,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pipProcess.stdout.on('data', (data) => {
          console.log(`PIP: ${data.toString().trim()}`);
        });

        pipProcess.stderr.on('data', (data) => {
          console.error(`PIP Error: ${data.toString().trim()}`);
        });

        pipProcess.on('close', (code) => {
          if (code === 0) {
            console.log('Python dependencies installed successfully');
            resolve(true);
          } else {
            console.error(`PIP installation failed with code ${code}`);
            reject(new Error(`PIP installation failed with code ${code}`));
          }
        });

        pipProcess.on('error', (error) => {
          console.error('Failed to install dependencies:', error);
          reject(error);
        });
      });

    } catch (error) {
      console.error('Error installing dependencies:', error);
      throw error;
    }
  }
}

// Create singleton instance
const ragServiceManager = new RAGServiceManager();

module.exports = ragServiceManager;
