export default {
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL
    }
  }
};