import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { BlurhashImage } from './BlurhashImage';

// Mock react-blurhash
vi.mock('react-blurhash', () => ({
  Blurhash: ({ hash }: { hash: string }) => (
    <div data-testid="blurhash-placeholder" data-hash={hash}>
      Blurhash Placeholder
    </div>
  ),
}));

describe('BlurhashImage', () => {
  it('renders image with src and alt text', () => {
    render(
      <BlurhashImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders blurhash placeholder when blurhash is provided', () => {
    const testHash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
    
    render(
      <BlurhashImage
        src="https://example.com/image.jpg"
        blurhash={testHash}
        alt="Test image"
      />
    );

    const placeholder = screen.getByTestId('blurhash-placeholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('data-hash', testHash);
  });

  it('does not render blurhash when no hash is provided', () => {
    render(
      <BlurhashImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    expect(screen.queryByTestId('blurhash-placeholder')).not.toBeInTheDocument();
  });

  it('hides blurhash placeholder after image loads', async () => {
    const testHash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
    
    render(
      <BlurhashImage
        src="https://example.com/image.jpg"
        blurhash={testHash}
        alt="Test image"
      />
    );

    // Initially, blurhash should be visible
    expect(screen.getByTestId('blurhash-placeholder')).toBeInTheDocument();

    // Simulate image load
    const img = screen.getByAltText('Test image');
    img.dispatchEvent(new Event('load'));

    // After load, image should have opacity 1
    await waitFor(() => {
      expect(img).toHaveStyle('opacity: 1');
    });
  });

  it('applies custom style prop', () => {
    const customStyle = { borderRadius: '8px' };
    
    render(
      <BlurhashImage
        src="https://example.com/image.jpg"
        alt="Test image"
        style={customStyle}
      />
    );

    // The wrapper div should have the custom style
    const img = screen.getByAltText('Test image');
    const wrapper = img.parentElement;
    expect(wrapper).toHaveStyle('border-radius: 8px');
  });
});
