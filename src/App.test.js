import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const testProduct = {
  id: 100,
  name: 'Elm lounge chair',
  price: 12000,
  category: 'Living Room',
  description: 'A test chair for offline shopping.',
  image: '/images/modern-fabric-sofa.jpg',
};

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    status: 200,
    json: async () => (String(url).endsWith('/products') ? [testProduct] : []),
  }));
});

test('keeps cart additions available and marked pending while offline', async () => {
  render(<App />);
  const addButton = await screen.findByRole('button', { name: /add elm lounge chair to cart/i });

  fireEvent.offline(window);
  expect(screen.getByRole('status')).toHaveTextContent('Offline');
  fireEvent.click(addButton);

  fireEvent.click(await screen.findByRole('link', { name: /cart 1/i }));
    expect(await screen.findByText(/yet to sync/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Elm lounge chair' })).toBeInTheDocument();
    expect(screen.getAllByText('₹12,000')).toHaveLength(2);

  fireEvent.online(window);
    expect(await screen.findByText('Synced')).toBeInTheDocument();
    expect(global.fetch.mock.calls.some(([url, options]) => (
      String(url).endsWith('/cart') && options?.method === 'POST'
    ))).toBe(true);
});
