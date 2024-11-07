import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TodosPage from './../pages/todos';

const mockTodos = [
  { id: 1, task: 'Task 1', completed: false, image: 'image1.jpg' },
  { id: 2, task: 'Task 2', completed: true, image: 'image2.jpg' },
  { id: 3, task: 'Task 3', completed: false, image: 'image3.jpg' },
];

describe('TodosPage', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('renders the TODO list and displays tasks', () => {
    render(<TodosPage todos={mockTodos} error={null} />);

    expect(screen.getByText('TODOs List')).toBeInTheDocument();

    mockTodos.forEach((todo) => {
      expect(screen.getByText(todo.task)).toBeInTheDocument();
    });
  });

  it('displays an error message when there is an error', () => {
    const error = { message: 'Failed to fetch TODOs' };
    render(<TodosPage todos={[]} error={error} />);
    expect(
      screen.getByText(`Error fetching TODOs: ${error.message}`),
    ).toBeInTheDocument();
  });

  it('calls updateTodoStatus when checkbox is clicked', async () => {
    fetch.mockResponseOnce(JSON.stringify({ completed: true }));
    render(<TodosPage todos={mockTodos} error={null} />);

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it('disables Previous button on the first page and Next button on the last page', async () => {
    const mockTodos = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      task: `Task ${i + 1}`,
      completed: i % 2 === 0,
      image: `image${i + 1}.jpg`,
    }));


    const todosPerPage = 9;
    const maxPages = Math.ceil(mockTodos.length / todosPerPage);

    render(<TodosPage todos={mockTodos} error={null} />);

    expect(screen.getByText('Previous')).toHaveClass('Mui-disabled');
    expect(screen.getByText('Next')).not.toHaveClass('Mui-disabled');

    for (let i = 1; i < maxPages - 1; i++) {
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => expect(screen.getByText('Previous')).not.toHaveClass('Mui-disabled'));
      expect(screen.getByText('Next')).not.toHaveClass('Mui-disabled');
    }

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => expect(screen.getByText('Next')).toHaveClass('Mui-disabled'));
    expect(screen.getByText('Previous')).not.toHaveClass('Mui-disabled');
  });

});

