import { constants } from 'fs';
import { access, stat, statfs } from 'fs/promises';
import { resolve } from 'path';

/** Chemin absolu, sans « .. », sans slash final (sauf la racine). */
export function normalizePath(input: string): string {
  const p = resolve(input.trim());
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

/** `child` est-il `parent` ou l'un de ses descendants ? */
export function isInside(child: string, parent: string): boolean {
  if (child === parent) return true;
  return child.startsWith(parent === '/' ? '/' : `${parent}/`);
}

/** Deux dossiers qui se chevauchent indexeraient les mêmes fichiers deux fois. */
export function overlaps(a: string, b: string): boolean {
  return isInside(a, b) || isInside(b, a);
}

export interface PathState {
  exists: boolean;
  isDirectory: boolean;
  readable: boolean;
  writable: boolean;
}

export async function inspectPath(path: string): Promise<PathState> {
  let isDirectory = false;
  try {
    isDirectory = (await stat(path)).isDirectory();
  } catch {
    return { exists: false, isDirectory: false, readable: false, writable: false };
  }
  const can = async (mode: number) => {
    try {
      await access(path, mode);
      return true;
    } catch {
      return false;
    }
  };
  return {
    exists: true,
    isDirectory,
    // X_OK en plus de R_OK : sans le bit d'exécution, un dossier est listable
    // mais on ne peut pas descendre dedans.
    readable: await can(constants.R_OK | constants.X_OK),
    writable: await can(constants.W_OK),
  };
}

export interface DiskUsage {
  totalBytes: number;
  freeBytes: number;
}

/** Taille et espace libre du système de fichiers portant `path`. */
export async function diskUsage(path: string): Promise<DiskUsage | null> {
  try {
    const fs = await statfs(path);
    return {
      totalBytes: Number(fs.blocks) * Number(fs.bsize),
      // bavail : blocs libres pour un utilisateur non privilégié.
      freeBytes: Number(fs.bavail) * Number(fs.bsize),
    };
  } catch {
    return null;
  }
}
