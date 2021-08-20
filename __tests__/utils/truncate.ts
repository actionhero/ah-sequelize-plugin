export async function truncate(models: Array<any>) {
  await Promise.all(
    models.map((model) => model.destroy({ truncate: true, force: true }))
  );
}
