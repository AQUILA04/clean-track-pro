
export const MOCK_USERS = [
    {
        id: '1',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'j.dupont@cleantrack.pro',
        role: 'Admin_Site',
        agencies: [
            { id: '1', name: 'Laverie Centre-Ville' },
            { id: '2', name: 'Pressing Nord' }
        ],
        avatar: null
    },
    {
        id: '2',
        firstName: 'Marie',
        lastName: 'Curie',
        email: 'm.curie@cleantrack.pro',
        role: 'User_Site',
        agencies: [
            { id: '1', name: 'Laverie Centre-Ville' }
        ],
        avatar: null
    },
    {
        id: '3',
        firstName: 'Lucas',
        lastName: 'Bernard',
        email: 'l.bernard@cleantrack.pro',
        role: 'User_Site',
        agencies: [
            { id: '2', name: 'Pressing Nord' },
            { id: '3', name: 'Gare Sud' }
        ],
        avatar: null
    },
    {
        id: '4',
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 's.martin@cleantrack.pro',
        role: 'Admin_Site',
        agencies: [
            { id: '3', name: 'Gare Sud' },
            { id: '4', name: 'Ouest Mall' }
        ],
        avatar: null
    }
];
