export const handleHelpCommand = () => {
  console.log(`ActorCLI: Available Commands
  
  Usage:
    actor <command> [options]
  
  Commands:
    load                           Load environment variables.
    sync                           Synchronize environment variables.
    simulate                       Simulate GitHub Actions locally using act.
    list                           List available workflows in .github/workflows.
    help                           Display this help message.
  
  Options:
    -h, --help                     Show this help message and exit.
    `);
};
