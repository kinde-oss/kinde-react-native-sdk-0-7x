const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const nodeModulesPath = path.resolve(workspaceRoot, 'node_modules');

/**
 * Metro config for pnpm workspaces.
 * pnpm uses symlinks which Metro doesn't follow by default.
 */
module.exports = {
    projectRoot,
    watchFolders: [workspaceRoot, path.join(nodeModulesPath, '.pnpm')],
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true
            }
        })
    },
    resolver: {
        nodeModulesPaths: [nodeModulesPath],
        useWatchman: false, // Watchman doesn't follow pnpm symlinks
        resolveRequest: (context, moduleName, platform) => {
            // Skip relative/absolute imports
            if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
                return context.resolveRequest(context, moduleName, platform);
            }

            // Parse scoped vs regular package
            const parts = moduleName.split('/');
            const isScoped = moduleName.startsWith('@');
            const packageName = isScoped
                ? parts.slice(0, 2).join('/')
                : parts[0];
            const subPath = isScoped
                ? parts.slice(2).join('/')
                : parts.slice(1).join('/');

            const packagePath = path.join(nodeModulesPath, packageName);
            if (!fs.existsSync(packagePath)) {
                return context.resolveRequest(context, moduleName, platform);
            }

            const realPath = fs.realpathSync(packagePath);

            // Resolve subpath or package main entry
            const resolveFile = (base) => {
                if (fs.existsSync(base + '.js')) return base + '.js';
                if (fs.existsSync(base) && fs.statSync(base).isFile())
                    return base;
                if (fs.existsSync(path.join(base, 'index.js')))
                    return path.join(base, 'index.js');
                return null;
            };

            if (subPath) {
                const resolved = resolveFile(path.join(realPath, subPath));
                if (resolved) return { type: 'sourceFile', filePath: resolved };
            } else {
                const pkgJson = path.join(realPath, 'package.json');
                if (fs.existsSync(pkgJson)) {
                    const main =
                        JSON.parse(fs.readFileSync(pkgJson, 'utf8')).main ||
                        'index.js';
                    const resolved = resolveFile(path.join(realPath, main));
                    if (resolved)
                        return { type: 'sourceFile', filePath: resolved };
                }
            }

            return context.resolveRequest(context, moduleName, platform);
        }
    }
};
