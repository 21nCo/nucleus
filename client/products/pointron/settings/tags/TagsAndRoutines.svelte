<script>
  import FormControlLabel from "@21n/elements/text/formLabel/FormControlLabel.svelte";
  import TagsList from "@nucleum/products/pointron/settings/tags/TagsList.svelte";
</script>

<div class="flex flex-col gap-8">
  <FormControlLabel
    props={{
      label: "Tags",
      tooltip: {
        body: "Tags are used to categorize tasks and routines. You can create and associate tags when adding a new task by simply typing the tag and selecting from dropdown"
      }
    }}
  />
  <TagsList />
</div>
