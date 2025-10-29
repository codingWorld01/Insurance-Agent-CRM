import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { ProfileImageUpload } from '../ProfileImageUpload'

// Mock hooks
vi.mock('@/hooks/useMobileDetection', () => ({
  useMobileDetection: () => ({
    isMobile: false,
    isTouchDevice: false,
  }),
}))

const mockOnChange = vi.fn()
const mockOnUpload = vi.fn().mockResolvedValue('https://cloudinary.com/test-image.jpg')

// Mock file for testing
const createMockImageFile = (name: string, size: number, type: string) => {
  const file = new File(['test image content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('ProfileImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload area when no image is present', () => {
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    expect(screen.getByText('Upload Profile Image')).toBeInTheDocument()
    expect(screen.getByText('Choose Image')).toBeInTheDocument()
    expect(screen.getByText('Supports JPG, PNG, GIF (max 5MB)')).toBeInTheDocument()
  })

  it('displays image preview when value is provided', () => {
    const imageUrl = 'https://cloudinary.com/existing-image.jpg'
    
    renderWithProviders(
      <ProfileImageUpload 
        value={imageUrl}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', imageUrl)
    expect(image).toHaveAttribute('alt', 'Profile')
  })

  it('validates image file size', async () => {
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    // Create a file larger than 5MB
    const largeFile = createMockImageFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg')
    
    const fileInput = screen.getByRole('button', { name: /choose image/i }).closest('div')?.querySelector('input[type="file"]')
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText('Image size must be less than 5MB')).toBeInTheDocument()
      })
    }
  })

  it('validates image file type', async () => {
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    // Create an unsupported file type
    const unsupportedFile = createMockImageFile('test.txt', 1024, 'text/plain')
    
    const fileInput = screen.getByRole('button', { name: /choose image/i }).closest('div')?.querySelector('input[type="file"]')
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [unsupportedFile],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText('Image type not supported')).toBeInTheDocument()
      })
    }
  })

  it('uploads valid image file', async () => {
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    const validFile = createMockImageFile('profile.jpg', 1024, 'image/jpeg')
    
    const fileInput = screen.getByRole('button', { name: /choose image/i }).closest('div')?.querySelector('input[type="file"]')
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(validFile)
        expect(mockOnChange).toHaveBeenCalledWith('https://cloudinary.com/test-image.jpg')
      })
    }
  })

  it('shows loading state during upload', async () => {
    const slowUpload = vi.fn(() => new Promise(resolve => setTimeout(() => resolve('https://cloudinary.com/test.jpg'), 100)))
    
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={slowUpload}
      />
    )

    const validFile = createMockImageFile('profile.jpg', 1024, 'image/jpeg')
    
    const fileInput = screen.getByRole('button', { name: /choose image/i }).closest('div')?.querySelector('input[type="file"]')
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      // Should show loading state
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()
      })
    }
  })

  it('allows image removal', async () => {
    const user = userEvent.setup()
    const imageUrl = 'https://cloudinary.com/existing-image.jpg'
    
    renderWithProviders(
      <ProfileImageUpload 
        value={imageUrl}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    const removeButton = screen.getByRole('button', { name: /remove/i })
    await user.click(removeButton)

    expect(mockOnChange).toHaveBeenCalledWith(undefined)
  })

  it('disables upload when disabled prop is true', () => {
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
        disabled={true}
      />
    )

    const chooseButton = screen.getByRole('button', { name: /choose image/i })
    expect(chooseButton).toBeDisabled()
  })

  it('handles drag and drop for image upload', async () => {
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    const uploadArea = screen.getByText('Upload Profile Image').closest('div')
    
    if (uploadArea) {
      // Test drag enter
      fireEvent.dragEnter(uploadArea)
      expect(uploadArea).toHaveClass('border-primary')

      // Test drag leave
      fireEvent.dragLeave(uploadArea)
      expect(uploadArea).not.toHaveClass('border-primary')

      // Test drop
      const file = createMockImageFile('profile.jpg', 1024, 'image/jpeg')
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file]
        }
      })

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file)
      })
    }
  })

  it('shows image preview with correct dimensions', () => {
    const imageUrl = 'https://cloudinary.com/existing-image.jpg'
    
    renderWithProviders(
      <ProfileImageUpload 
        value={imageUrl}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    const image = screen.getByRole('img')
    expect(image).toHaveClass('w-32', 'h-32') // Should have fixed dimensions
  })

  it('handles upload errors gracefully', async () => {
    const failingUpload = vi.fn().mockRejectedValue(new Error('Upload failed'))
    
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={failingUpload}
      />
    )

    const validFile = createMockImageFile('profile.jpg', 1024, 'image/jpeg')
    
    const fileInput = screen.getByRole('button', { name: /choose image/i }).closest('div')?.querySelector('input[type="file"]')
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    }
  })

  it('accepts only image file types in file input', () => {
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    const fileInput = screen.getByRole('button', { name: /choose image/i }).closest('div')?.querySelector('input[type="file"]')
    expect(fileInput).toHaveAttribute('accept', 'image/*')
  })

  it('resets file input after selection', async () => {
    renderWithProviders(
      <ProfileImageUpload 
        value={undefined}
        onChange={mockOnChange}
        onUpload={mockOnUpload}
      />
    )

    const validFile = createMockImageFile('profile.jpg', 1024, 'image/jpeg')
    
    const fileInput = screen.getByRole('button', { name: /choose image/i }).closest('div')?.querySelector('input[type="file"]') as HTMLInputElement
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(fileInput.value).toBe('')
      })
    }
  })
})