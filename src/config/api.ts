const path = require("path");

export const DEFAULT = {
  general: config => {
    return {
      paths: {
        action: [path.join(__dirname, "..", "actions")],
        task: [path.join(__dirname, "..", "tasks")],
        server: [path.join(__dirname, "..", "servers")],
        cli: [path.join(__dirname, "..", "bin")],
        initializer: [path.join(__dirname, "..", "initializers")],
        public: [path.join(process.cwd(), "public")],
        pid: [path.join(process.cwd(), "pids")],
        log: [path.join(process.cwd(), "log")],
        plugin: [path.join(process.cwd(), "node_modules")],
        locale: [path.join(process.cwd(), "locales")],
        test: [path.join(process.cwd(), "__tests__")],
        // for the src and dist paths, assume we are running in compiled mode from `dist`
        src: path.join(process.cwd(), "src"),
        dist: path.join(process.cwd(), "dist")
      }
    };
  }
};
