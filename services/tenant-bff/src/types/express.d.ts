declare global {
  namespace Express {
    interface Request {
      user?: { id: string; roles: string[]; perms: string[] };
      orgId?: string;
      projectId?: string | null;
    }
  }
}

export {};
