export interface OrcaUser {
  user_id: string;
  name: string;
  email: string;
  first: string;
  last: string;
}

export interface OrcaGroup {
  id: string;
  name: string;
  description?: string;
  sso_group: boolean;
  users: string[];
}

// /api/organization/users
export interface OrcaUsersResponse {
  status: string;
  data: {
    name: string;
    users: OrcaUser[];
  };
}

// /api/rbac/group
export interface OrcaGroupsResponse {
  status: string;
  data: {
    groups: Omit<OrcaGroup, 'users'>[];
  };
}

// /api/rbac/group/<id>
export interface OrcaGroupResponse {
  status: string;
  data: {
    group: string;
    description?: string;
    all_users: boolean;
    users: {
      id: string;
    }[];
  };
}
