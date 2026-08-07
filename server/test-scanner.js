import { cloneRepository } from "./src/services/scanner.service.js";

try {
  const path = await cloneRepository(
    "https://github.com/Sunkencoder19/network-security-monitoring-system"
  );

  console.log(path);
} catch (error) {
  console.log(error.message);
}