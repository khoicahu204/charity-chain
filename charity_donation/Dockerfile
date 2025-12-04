FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

# Install Foundry (Anvil)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN foundryup

# Install Python dependencies
RUN pip install vyper==0.3.10 web3

# Set working directory
WORKDIR /app/charity_donation

# Copy project files
COPY . .

# Create directory for frontend artifacts (to match relative path in deploy.py)
RUN mkdir -p /app/frontend/src/contracts

# Expose Anvil port
EXPOSE 8545

# Start Anvil and run deploy script
CMD anvil --host 0.0.0.0 --block-time 1 > /dev/null 2>&1 & \
    echo "Waiting for Anvil..." && \
    sleep 5 && \
    python scripts/deploy.py && \
    tail -f /dev/null
