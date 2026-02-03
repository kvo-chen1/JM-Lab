// search-bar.test.js
import { PinterestSearchBar } from './search-bar';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';

describe('PinterestSearchBar', () => {
  let container;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders correctly', () => {
    new PinterestSearchBar('test-container');
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  test('focus updates style', () => {
    new PinterestSearchBar('test-container');
    const input = screen.getByPlaceholderText('Search');
    const searchBar = container.querySelector('.pinterest-search-bar');

    fireEvent.focus(input);
    expect(searchBar).toHaveClass('focused');

    fireEvent.blur(input);
    expect(searchBar).not.toHaveClass('focused');
  });

  test('clear button visibility', () => {
    new PinterestSearchBar('test-container');
    const input = screen.getByPlaceholderText('Search');
    const clearBtn = screen.getByLabelText('Clear search');

    expect(clearBtn).not.toHaveClass('visible');

    fireEvent.input(input, { target: { value: 'test' } });
    expect(clearBtn).toHaveClass('visible');

    fireEvent.input(input, { target: { value: '' } });
    expect(clearBtn).not.toHaveClass('visible');
  });

  test('debounced search execution', async () => {
    const mockSearch = jest.fn().mockResolvedValue([]);
    new PinterestSearchBar('test-container', { 
        onSearch: mockSearch,
        debounceTime: 300 
    });
    
    const input = screen.getByPlaceholderText('Search');
    fireEvent.input(input, { target: { value: 'hello' } });

    // Should not be called immediately
    expect(mockSearch).not.toHaveBeenCalled();

    // Fast forward time
    jest.advanceTimersByTime(300);
    
    expect(mockSearch).toHaveBeenCalledWith('hello');
  });

  test('keyboard shortcuts', () => {
    new PinterestSearchBar('test-container');
    const input = screen.getByPlaceholderText('Search');

    // Press '/' to focus
    fireEvent.keyDown(document, { key: '/' });
    expect(document.activeElement).toBe(input);

    // Press 'Escape' to clear and blur
    fireEvent.input(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(input.value).toBe('');
    expect(document.activeElement).not.toBe(input);
  });
});
