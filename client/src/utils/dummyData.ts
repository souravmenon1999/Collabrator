// utils/dummyData.ts
import { nanoid } from '@reduxjs/toolkit';
import { Folder, Space, SubThread } from '../types/types';

export const generateDummyData = () => {
  const folders: Folder[] = [
    {
      id: 'folder1',
      name: 'Primacle Motorworks',
      isExpanded: true,
      spaces: ['space1', 'space2', 'space3'],
      created: '31 Dec 2024',
      author: 'Sinto',
      lastActivity: '5:22 PM',
      hasNotification: true,
      unreadCount: 3,
    },
    {
      id: 'folder2',
      name: 'Real Estate Projects',
      isExpanded: false,
      spaces: ['space4', 'space5', 'space6'],
      created: '31 Dec 2024',
      author: 'Sinto',
      lastActivity: '6:15 PM',
      hasNotification: false,
      unreadCount: 0,
    },
    {
      id: 'folder3',
      name: 'Mobile App Development',
      isExpanded: true,
      spaces: ['space7', 'space8'],
      created: '2 Jan 2025',
      author: 'Sinto',
      lastActivity: '9:10 AM',
      hasNotification: true,
      unreadCount: 1,
    },
    {
      id: 'folder4',
      name: 'Client Support',
      isExpanded: true,
      spaces: ['space9', 'space10'],
      created: '3 Jan 2025',
      author: 'Anna',
      lastActivity: '2:30 PM',
      hasNotification: false,
      unreadCount: 2,
    },
    {
      id: 'folder5',
      name: 'Marketing Campaigns',
      isExpanded: false,
      spaces: ['space11', 'space12'],
      created: '5 Jan 2025',
      author: 'Michael',
      lastActivity: '11:00 AM',
      hasNotification: true,
      unreadCount: 4,
    },
  ];
  const spaces: Space[] = [
    {
      id: 'space1',
      name: 'Nissan Service',
      folderId: 'folder1',
      subThreads: ['thread1', 'thread2'],
      created: '1 Jan 2025',
    },
    {
      id: 'space2',
      name: 'Hyundai Sales',
      folderId: 'folder1',
      subThreads: ['thread3'],
      created: '2 Jan 2025',
    },
    {
      id: 'space3',
      name: 'Volkswagen Sales',
      folderId: 'folder1',
      subThreads: ['thread4'],
      created: '3 Jan 2025',
    },
    {
      id: 'space4',
      name: 'Guruvayoor',
      folderId: 'folder2',
      subThreads: ['thread5'],
      created: '4 Jan 2025',
    },
    {
      id: 'space5',
      name: 'Coimbatore Real Estate',
      folderId: 'folder2',
      subThreads: ['thread6'],
      created: '5 Jan 2025',
    },
    {
      id: 'space6',
      name: 'Kochi Projects',
      folderId: 'folder2',
      subThreads: ['thread7'],
      created: '6 Jan 2025',
    },
    {
      id: 'space7',
      name: 'App Development',
      folderId: 'folder3',
      subThreads: ['thread8'],
      created: '7 Jan 2025',
    },
    {
      id: 'space8',
      name: 'User Feedback',
      folderId: 'folder3',
      subThreads: ['thread9'],
      created: '8 Jan 2025',
    },
    {
      id: 'space9',
      name: 'Client Queries',
      folderId: 'folder4',
      subThreads: ['thread10', 'thread11'],
      created: '9 Jan 2025',
    },
    {
      id: 'space10',
      name: 'Support Tickets',
      folderId: 'folder4',
      subThreads: ['thread12'],
      created: '10 Jan 2025',
    },
    {
      id: 'space11',
      name: 'Campaign Strategy',
      folderId: 'folder5',
      subThreads: ['thread13'],
      created: '11 Jan 2025',
    },
    {
      id: 'space12',
      name: 'Ad Spend Analysis',
      folderId: 'folder5',
      subThreads: ['thread14'],
      created: '12 Jan 2025',
    },
  ];
  

  const subThreads: SubThread[] = [
    {
      id: 'thread1',
      title: 'Sinto',
      spaceId: 'space1',
      messages: [
        {
          id: 'msg1',
          content: 'Daily Reports Submission',
          sender: 'other',
          timestamp: new Date(2024, 1, 5, 11, 9),
          status: 'read',
        },
        {
          id: 'msg2',
          content: 'Working on it',
          sender: 'user',
          timestamp: new Date(),
          status: 'delivered',
        },
        {
          id: 'msg3',
          content: 'Let me know if you need any help.',
          sender: 'other',
          timestamp: new Date(2024, 1, 5, 11, 15),
          status: 'read',
        },
      ],
      unread: 2,
    },
    {
      id: 'thread2',
      title: 'Alwyn',
      spaceId: 'space1',
      messages: [
        {
          id: 'msg4',
          content: 'Lorem ipsum dolor sit amet.',
          sender: 'other',
          timestamp: new Date(2024, 1, 4, 14, 30),
          status: 'read',
        },
        {
          id: 'msg5',
          content: 'Consectetur adipiscing elit.',
          sender: 'user',
          timestamp: new Date(2024, 1, 4, 14, 35),
          status: 'delivered',
        },
      ],
      unread: 1,
    },
    {
      id: 'thread3',
      title: 'Elic',
      spaceId: 'space2',
      messages: [
        {
          id: 'msg6',
          content: 'Ut enim ad minim veniam.',
          sender: 'other',
          timestamp: new Date(2024, 1, 3, 9, 0),
          status: 'read',
        },
        {
          id: 'msg7',
          content: 'Quis nostrud exercitation ullamco.',
          sender: 'user',
          timestamp: new Date(2024, 1, 3, 9, 5),
          status: 'delivered',
        },
        {
          id: 'msg8',
          content: 'Laboris nisi ut aliquip ex ea commodo consequat.',
          sender: 'other',
          timestamp: new Date(2024, 1, 3, 9, 10),
          status: 'read',
        },
      ],
      unread: 0,
    },
    {
      id: 'thread4',
      title: 'Me',
      spaceId: 'space3',
      messages: [
        {
          id: 'msg9',
          content: 'Adipiscing elit, sed do eiusmod tempor.',
          sender: 'other',
          timestamp: new Date(2024, 1, 2, 16, 45),
          status: 'read',
        },
        {
          id: 'msg10',
          content: 'Incididunt ut labore et dolore magna aliqua.',
          sender: 'user',
          timestamp: new Date(2024, 1, 2, 16, 50),
          status: 'delivered',
        },
      ],
      unread: 3,
    },
    {
      id: 'thread5',
      title: 'Guruvayoor Real Estate',
      spaceId: 'space4',
      messages: [
        {
          id: 'msg11',
          content: 'Property Investment Update',
          sender: 'user',
          timestamp: new Date(2024, 1, 1, 10, 0),
          status: 'delivered',
        },
      ],
      unread: 0,
    },
    {
      id: 'thread6',
      title: 'Coimbatore Property Discussion',
      spaceId: 'space5',
      messages: [
        {
          id: 'msg12',
          content: 'New Property Launch',
          sender: 'other',
          timestamp: new Date(2024, 0, 30, 15, 0),
          status: 'read',
        },
      ],
      unread: 1,
    },
    {
      id: 'thread7',
      title: 'Kochi Real Estate Projects',
      spaceId: 'space6',
      messages: [
        {
          id: 'msg13',
          content: 'Developing New Commercial Area',
          sender: 'user',
          timestamp: new Date(2024, 0, 28, 11, 30),
          status: 'delivered',
        },
      ],
      unread: 0,
    },
    {
      id: 'thread8',
      title: 'App Launch',
      spaceId: 'space7',
      messages: [
        {
          id: 'msg14',
          content: 'Launch of the new app version scheduled.',
          sender: 'user',
          timestamp: new Date(2024, 1, 5, 12, 0),
          status: 'delivered',
        },
      ],
      unread: 2,
    },
    {
      id: 'thread9',
      title: 'User Feedback',
      spaceId: 'space8',
      messages: [
        {
          id: 'msg15',
          content: 'Bug reported in the latest version.',
          sender: 'other',
          timestamp: new Date(2024, 1, 4, 17, 30),
          status: 'read',
        },
      ],
      unread: 1,
    },
    {
      id: 'thread10',
      title: 'Client Query 1',
      spaceId: 'space9',
      messages: [
        {
          id: 'msg16',
          content: 'Could you provide more details on the project?',
          sender: 'client',
          timestamp: new Date(2024, 1, 2, 14, 45),
          status: 'delivered',
        },
      ],
      unread: 1,
    },
    {
      id: 'thread11',
      title: 'Client Query 2',
      spaceId: 'space9',
      messages: [
        {
          id: 'msg17',
          content: 'Looking for more information about your services.',
          sender: 'client',
          timestamp: new Date(2024, 1, 3, 10, 0),
          status: 'read',
        },
      ],
      unread: 0,
    },
    {
      id: 'thread12',
      title: 'Support Ticket 101',
      spaceId: 'space10',
      messages: [
        {
          id: 'msg18',
          content: 'Issue with the billing process.',
          sender: 'user',
          timestamp: new Date(2024, 1, 4, 11, 0),
          status: 'delivered',
        },
      ],
      unread: 2,
    },
    {
      id: 'thread13',
      title: 'Campaign Ad Progress',
      spaceId: 'space11',
      messages: [
        {
          id: 'msg19',
          content: 'Ad visuals need to be reviewed.',
          sender: 'user',
          timestamp: new Date(2024, 1, 5, 14, 30),
          status: 'delivered',
        },
      ],
      unread: 1,
    },
    {
      id: 'thread14',
      title: 'Ad Spend Analysis Update',
      spaceId: 'space12',
      messages: [
        {
          id: 'msg20',
          content: 'Here is the updated report.',
          sender: 'user',
          timestamp: new Date(2024, 1, 5, 15, 0),
          status: 'delivered',
        },
      ],
      unread: 3,
    },
  ];

  return { folders, spaces, subThreads };
};
