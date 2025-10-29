import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Test to verify the basic rendering of the application
 */
test('renders restaurant menu summarizer title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Restaurant Menu Summarizer/i);
  expect(titleElement).toBeInTheDocument();
});
