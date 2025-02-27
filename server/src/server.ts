import env, { getThreadIndex } from './env';
import api from './api';

const port = env.PORT || 5000;

api.listen(port, () => {
  console.log(`[v1 ADAPTED]: Server running on port ${port}. Thread Index: ${getThreadIndex()}`);
});
