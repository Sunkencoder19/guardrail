import { fetchRepository } from "./src/services/github.service.js";

try {
  const repository = await fetchRepository(
    "https://github.com/Sunkencoder19/network-security-monitoring-system"
  );

  console.log(repository);
} catch (error) {
  console.error(error.message);
}