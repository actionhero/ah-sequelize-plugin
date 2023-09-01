export async function truncate(models: Array<any>) {
  try {
    await Promise.all(
      models.map((model) => model.destroy({ truncate: true, force: true })),
    );
  } catch (error) {
    console.error(error); // jest has trouble showing the fill DB error
    throw error;
  }
}
