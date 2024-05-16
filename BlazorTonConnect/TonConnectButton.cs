using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace BlazorTonConnect;

partial class TonConnectButton
{
    private IJSObjectReference? tonInteropModule;
    private IJSObjectReference? facadeReference;
    private ElementReference containerRef;

    [Inject] 
    protected IJSRuntime? JsRuntime { get; init; }

    protected override async Task OnInitializedAsync()
    {
        await base.OnInitializedAsync();
        
        tonInteropModule = (await GetJsRuntimeOrThrow().InvokeAsync<IJSObjectReference>("import", "./_content/BlazorTonConnect/js/BlazorTonConnectInterop.js"))
                           ?? throw new FileLoadException("Failed to load Rete JS module");
        
        facadeReference = await tonInteropModule.InvokeAsync<IJSObjectReference>("renderEditor", containerRef)
                              ?? throw new ArgumentException("Failed to initialize Rete.js editor");
    }

    public async Task OpenModal()
    {
        await GetFacadeOrThrow().InvokeVoidAsync("openModal");
    }
    
    private IJSObjectReference GetFacadeOrThrow()
    {
        if (facadeReference == null)
        {
            throw new InvalidOperationException("Facade is not ready yet, wait until it is loaded");
        }

        return facadeReference;
    }

    private IJSRuntime GetJsRuntimeOrThrow()
    {
        if (JsRuntime == null)
        {
            throw new InvalidOperationException("JSRuntime is not ready yet, wait until it is loaded");
        }

        return JsRuntime;
    }
}