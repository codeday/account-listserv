/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch';
import { sign } from 'jsonwebtoken';
import config from './config';

const queryAllRoles = `query AllRoles {
  account {
    roles {
      id
    }
  }
}`;

const queryEmailsByRole = `query EmailsByRole($roleId: String!) {
  account {
    roleUsers(roleId: $roleId) {
      givenName
      familyName
      name
      email
    }
  }
}`;

const queryRolesByUsername = `query RolesByUsername($username: String!) {
  account {
    getUser(where: { username: $username }) {
      roles {
        id
      }
    }
  }
}`;

function getToken() {
  return sign({ scopes: 'read:users' }, config.account.secret, { expiresIn: '1m' });
}

async function doRequest(query: string, variables: Record<string, any>): Promise<any> {
  const request = await fetch('https://graph.codeday.org/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await request.json()).data;
}

async function getAllRoles(): Promise<string[]> {
  const result = await doRequest(queryAllRoles, {});
  return result?.account?.roles?.map(({ id }: any) => id) || [];
}

async function fixRoleCase(roleId: string): Promise<string> {
  const roles = await getAllRoles();
  return roles.filter((id) => id.toLowerCase() === roleId.toLowerCase())[0] || roleId;
}

export interface User {
  name: string
  givenName: string
  familyName: string
  email: string
}

export async function getUsersForRole(roleId: string): Promise<User[]> {
  const result = await doRequest(queryEmailsByRole, { roleId: await fixRoleCase(roleId) });
  return result?.account?.roleUsers.filter(({ email }: User) => email) || [];
}

export async function getRolesByUsername(username: string): Promise<string[]> {
  const result = await doRequest(queryRolesByUsername, { username });
  return result?.account?.getUser?.roles?.map((r: any) => r.id).filter(Boolean) || [];
}
