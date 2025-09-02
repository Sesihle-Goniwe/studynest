import { TestBed } from '@angular/core/testing';

import { GroupChatsService } from './group-chats.service';

describe('GroupChats', () => {
  let service: GroupChatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupChatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
