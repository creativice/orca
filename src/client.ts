import fetch from 'node-fetch';

import { IntegrationProviderAuthenticationError } from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './config';
import {
  OrcaUser,
  OrcaUsersResponse,
  OrcaGroupsResponse,
  OrcaGroup,
  OrcaGroupResponse,
} from './types';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  constructor(readonly config: IntegrationConfig) {}

  public async verifyAuthentication(): Promise<void> {
    const response = await fetch(`https://api.orcasecurity.io/api/rbac/group`, {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${this.config.clientSecret}`,
      },
    });

    if (!response.ok) {
      throw new IntegrationProviderAuthenticationError({
        cause: new Error('Provider authentication failed'),
        endpoint: 'https://api.orcasecurity.io/api/user/session',
        status: response.status,
        statusText: response.statusText,
      });
    }
  }

  private async getRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`https://api.orcasecurity.io/api${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.config.clientSecret}`,
      },
    });

    if (!response.ok) {
      // TODO:
      throw new Error('Fetch threw error');
    }

    return response.json();
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<OrcaUser>,
  ): Promise<void> {
    const response: OrcaUsersResponse = await this.getRequest(
      '/organization/users',
    );

    for (const user of response.data.users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each group resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateGroups(
    iteratee: ResourceIteratee<OrcaGroup>,
  ): Promise<void> {
    const groupsResponse: OrcaGroupsResponse = await this.getRequest(
      '/rbac/group',
    );

    for (const group of groupsResponse.data.groups) {
      const groupResponse: OrcaGroupResponse = await this.getRequest(
        `/rbac/group/${group.id}`,
      );

      await iteratee({
        id: group.id,
        name: group.name,
        sso_group: group.sso_group,
        description: group.description,
        users: groupResponse.data.users.map((user) => user.id),
      });
    }
  }
}

export function createAPIClient(config: IntegrationConfig): APIClient {
  return new APIClient(config);
}
