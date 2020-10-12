export async function truncate(models: Array<any>) {
  await Promise.all(
    models.map(
      async (model) => await model.destroy({ truncate: true, force: true })
    )
  );
}
