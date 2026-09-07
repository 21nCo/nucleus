<script lang="ts">
  let { user }: { user: any } = $props();
</script>

<div>
  <span class="text-fgs3"> User data - new sign in method </span>
  <div class="flex flex-col gap-1">
    <span>
      Name: {user.name}
    </span>
    <span>
      Email: {user.email}
    </span>
    <span>
      Region: {user.region}
    </span>
    <span>
      Email verified: {user.emailVerified}
    </span>
    <span>
      Two factor: {user.twoFactorEnabled}
    </span>
    <span>
      Created at: {user.createdAt}
    </span>
  </div>
</div>
