import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { NotificationsService } from 'src/notifications/notifications.service';

function makeClient(opts?: {
  createdGroup?: any[];
  allGroups?: any[];
  myGroups?: any[];
  groupName?: string;
  members?: Array<{ user_id: string }>;
}) {
  const {
    createdGroup = [{ id: 'g1', name: 'G', description: 'D', created_by: 'u0' }],
    allGroups = [{ id: 'g1', name: 'G' }],
    myGroups = [{ group_id: 'g1', role: 'member', study_groups: { id: 'g1', name: 'G' } }],
    groupName = 'G',
    members = [{ user_id: 'u1' }, { user_id: 'u2' }],
  } = opts ?? {};

  return {
    from: jest.fn((table: string) => {
      if (table === 'study_groups') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: createdGroup, error: null }),
          }),
          select: jest.fn().mockResolvedValue({ data: allGroups, error: null }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ id: 'g1', name: 'New', description: 'New D' }], error: null }),
          }),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { name: groupName }, error: null }),
          }),
        };
      }

      if (table === 'group_members') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: [{ group_id: 'g1', user_id: 'u0', role: 'member' }], error: null }),
          }),
          select: jest.fn().mockReturnThis(),
          eq: jest.fn(() => ({ // chained eq(...).eq(...) in leaveGroup is not used here
            // for getMyGroups: only one .eq call
            // but we also use eq for fetching members in joinGroup
            // so return resolved members
            // adapt for both cases:
            // If called again, still return members.
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            // For member list fetch:
            then: undefined,
          })),
          // direct path (get members)
          // easier: override select().eq() used in joinGroup with this:
          select_user: jest.fn().mockReturnValue({ data: members, error: null }),
        };
      }

      if (table === 'notifications') {
        return {
          insert: jest.fn().mockResolvedValue({ data: [{ id: 'n1' }], error: null }),
        };
      }

      return {
        select: jest.fn().mockResolvedValue({ data: myGroups, error: null }),
      };
    }),
  };
}

describe('GroupsService', () => {
  let service: GroupsService;
  let supabaseSvc: { getClient: jest.Mock };
  let notifications: { createNotification: jest.Mock };

  beforeEach(async () => {
    supabaseSvc = { getClient: jest.fn() };
    notifications = { createNotification: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: SupabaseService, useValue: supabaseSvc },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(GroupsService);
  });

  it('createGroup inserts and returns created group', async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient());
    const res = await service.createGroup('G', 'D', 'u0');
    expect(res).toEqual([{ id: 'g1', name: 'G', description: 'D', created_by: 'u0' }]);
  });

  it('getAllGroup returns groups', async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ allGroups: [{ id: 'g1', name: 'G' }] }));
    const res = await service.getAllGroup();
    expect(res).toEqual([{ id: 'g1', name: 'G' }]);
  });

  it('joinGroup inserts membership, fetches name & members, and creates notifications for other members', async () => {
    const client = makeClient({
      groupName: 'Algebra',
      members: [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u0' }], // u0 is the joining user
    });

    // We need to return proper shapes on chained calls used in joinGroup:
    // override group_members select().eq() to resolve members:
    (client.from as any) = jest.fn((table: string) => {
      if (table === 'group_members') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ group_id: 'g1', user_id: 'u0', role: 'member' }],
              error: null,
            }),
          }),
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u0' }], error: null }),
        };
      }
      if (table === 'study_groups') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { name: 'Algebra' }, error: null }),
          }),
        };
      }
      if (table === 'notifications') {
        return {
          insert: jest.fn().mockResolvedValue({ data: [{ id: 'n1' }], error: null }),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    supabaseSvc.getClient.mockReturnValue(client);

    const res = await service.joinGroup('g1', 'u0', 'member');
    expect(res).toEqual([{ group_id: 'g1', user_id: 'u0', role: 'member' }]);

    // Notifications should NOT be sent to the joining user 'u0'
    expect(notifications.createNotification).toHaveBeenCalledTimes(2);
    expect(notifications.createNotification).toHaveBeenCalledWith('u1', 'Algebra');
    expect(notifications.createNotification).toHaveBeenCalledWith('u2', 'Algebra');
  });

  it('getMyGroups returns memberships with joined group details', async () => {
    const client = {
      from: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({
          data: [{ group_id: 'g1', role: 'member', study_groups: { id: 'g1', name: 'G' } }],
          error: null,
        }),
        eq: jest.fn().mockReturnThis(),
      })),
    };
    supabaseSvc.getClient.mockReturnValue(client as any);

    const res = await service.getMyGroups('u1');
    expect(res).toEqual([{ group_id: 'g1', role: 'member', study_groups: { id: 'g1', name: 'G' } }]);
  });

  it('deleteGroup deletes by creator', async () => {
    const client = {
      from: jest.fn(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    };
    supabaseSvc.getClient.mockReturnValue(client as any);

    const res = await service.deleteGroup('u0');
    expect(res).toEqual([]);
  });

  it('updateGroup updates name/description', async () => {
    const client = {
      from: jest.fn(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: 'g1', name: 'New', description: 'New D' }],
            error: null,
          }),
        }),
      })),
    };
    supabaseSvc.getClient.mockReturnValue(client as any);

    const res = await service.updateGroup('g1', 'New', 'New D');
    expect(res).toEqual([{ id: 'g1', name: 'New', description: 'New D' }]);
  });
});
