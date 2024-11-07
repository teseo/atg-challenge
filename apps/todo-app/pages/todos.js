import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Grid2 as Grid,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';

const ThemedCheckbox = styled(Checkbox)(({ theme }) => {
  return {
    color: theme.status?.active?.main,
    '&:hover': {
      color: theme.status?.active?.dark,
    },
    '&.Mui-checked': {
      color: theme.status?.active?.main,
    },
  };
});

const ThemedButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.status?.active?.main,
  '&:hover': {
    backgroundColor: theme.status?.active?.dark,
  },
}));

const ThemedBox = styled(Box)(({ url }) => ({
  width: '100%',
  height: '200px',
  backgroundImage: `url(${url})`,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
}));

const requestUpdateTodoStatus = (id, task, completed) => {
  return fetch(
    `${process.env.NEXT_PUBLIC_LAMBDA_API_ENDPOINT}/todos/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, completed }),
    },
  );
};

export default function TodosPage({ todos, error }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [todosList, setTodosList] = useState([]);
  const [loading, setLoading] = useState(false);

  const todosPerPage = 9;
  const lastTodoIndex = currentPage * todosPerPage;
  const firstTodoIndex = lastTodoIndex - todosPerPage;
  const todosPaged = todosList.slice(
    firstTodoIndex,
    lastTodoIndex,
  );

  useEffect(() => {
    setTodosList(todos);
  }, [todos]);


  if (error) {
    return <div>Error fetching TODOs: {error.message}</div>;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    setCurrentPage(currentPage + 1);
  };

  const updateTodoStatus = async (id, task, completed) => {
    setLoading(true);
    try {
      const response = await requestUpdateTodoStatus(id, task, completed);

      if (!response.ok) {
        throw new Error('Failed to update TODO');
      }

      const updatedTodo = await response.json();

      setTodosList((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === id ? { ...todo, completed: updatedTodo.completed } : todo,
        ),
      );
    } catch (error) {
      console.error('Error updating TODO:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (id, task, completed) => {
    updateTodoStatus(id, task, !completed);
  };

  const isFirstPage = currentPage === 1;
  const isLastPage = Math.ceil(todos.length / todosPerPage) === currentPage;
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        TODOs List
      </Typography>

      <Grid container spacing={2}>
        {todosPaged.map((todo, index) => (
          <Grid key={index} size={{ xs: 6, md: 4, xl: 3 }}>
            <Paper>
              <ThemedBox url={todo.image} />
              <ListItem>
                <ThemedCheckbox
                  checked={todo.completed}
                  onChange={() =>
                    handleCheckboxChange(todo.id, todo.task, todo.completed)
                  }
                  disabled={loading}
                />
                <ListItemText
                  primary={todo.task}
                  secondary={todo.completed ? 'Completed' : 'Pending'}
                />
              </ListItem>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box mt={2}>
        <ThemedButton
          onClick={handlePrevious}
          variant="contained"
          disabled={isFirstPage}
        >
          Previous
        </ThemedButton>
        <Typography variant="body1" component="span" mx={2}>
          Page {currentPage}
        </Typography>

        <ThemedButton
          onClick={handleNext}
          variant="contained"
          disabled={isLastPage}
        >
          Next
        </ThemedButton>
      </Box>
    </Container>
  );
}

export async function getServerSideProps() {
  try {
    const res = await fetch(`${process.env.LAMBDA_API_ENDPOINT}/todos`);

    if (!res.ok) {
      throw new Error('Failed to fetch TODOs');
    }

    const todos = await res.json();

    return {
      props: {
        todos: todos,
      },
    };
  } catch (error) {
    return {
      props: {
        todos: [],
        error: { message: error.message },
      },
    };
  }
}
