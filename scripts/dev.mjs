import { spawn } from "node:child_process";
const children = [
  spawn("npm", ["run", "dev", "-w", "@marginguard/app"], {
    stdio: "inherit",
    env: process.env,
  }),
  spawn("npm", ["run", "dev", "-w", "frontend", "--", "--host", "127.0.0.1"], {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_MOCK_MODE: process.env.VITE_MOCK_MODE ?? "true",
    },
  }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill("SIGTERM"));
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
children.forEach((child) => {
  child.on("exit", (code) => stop(code ?? 0));
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
});
