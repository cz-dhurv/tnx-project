"""Entry point: python -m voice_agent"""

from voice_agent.agent import server
from livekit.agents import cli

def main():
    cli.run_app(server)

if __name__ == "__main__":
    main()
