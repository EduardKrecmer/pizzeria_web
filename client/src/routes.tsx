// client/src/routes.tsx
import React from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';

import Home from './pages/Home';
import PizzaDetail from './pages/PizzaDetail';
import Checkout from './pages/Checkout';
import ErrorPage from './pages/ErrorPage';
import NotFound from './pages/not-found';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: 'pizza/:id',
                element: <PizzaDetail />,
            },
            {
                path: 'checkout',
                element: <Checkout />,
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);
