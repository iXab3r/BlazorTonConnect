import {createRoot} from "react-dom/client";
import * as React from "react";
import {StrictMode, useEffect, useRef} from "react";
import {
    Account, ITonConnect, TonConnect,
    TonConnectButton,
    TonConnectUI,
    TonConnectUIProvider,
    useTonConnectUI,
    useTonWallet, Wallet
} from '@tonconnect/ui-react';
import {TonConnectStorage} from "./TonConnectStorage";

const editors: { [id: string]: TonConnectFacade } = {};

export class TonConnectFacade {
    private readonly container: HTMLElement;
    private readonly tonConnect: ITonConnect;
    
    private tonConnectUI: TonConnectUI;

    constructor(container: HTMLElement, tonConnect: ITonConnect) {
        this.container = container;
        this.tonConnect = tonConnect;

        tonConnect.onStatusChange(wallet => {

            if (wallet){
                console.log(`Wallet is connected: ${JSON.stringify(wallet)}`);
            } else {
                console.log(`Wallet is disconnected`);
            }

        });
    }
    
    public openModal() : Promise<void>{
        return this.getTonConnectOrThrow().openModal();
    }

    public openSingleWalletModal(wallet: string) : Promise<void>{
        return this.getTonConnectOrThrow().openSingleWalletModal(wallet);
    }

    public closeModal() : void{
        return this.getTonConnectOrThrow().closeModal();
    }

    public closeSingleWalletModal() : void{
        return this.getTonConnectOrThrow().closeSingleWalletModal();
    }
    
    public getConnected() : boolean{
        return this.getTonConnectOrThrow().connected;
    }

    public getAccount() : Account{
        return this.getTonConnectOrThrow().account;
    }

    public getWallet() : Wallet{
        return this.getTonConnectOrThrow().wallet;
    }

    public disconnect() : Promise<void>{
        return this.getTonConnectOrThrow().disconnect();
    }

    public updateConnectUI(tonConnectUI: TonConnectUI){
        console.log(`Ton connect UI: ${tonConnectUI}`);
        this.tonConnectUI = tonConnectUI;
    }
    
    private getTonConnectOrThrow(){
        if (!this.tonConnectUI){
            throw `TonConnect UI is not ready`;
        }
        return this.tonConnectUI;
    }
}

export async function renderEditor(container: HTMLElement): Promise<TonConnectFacade> {
    await renderReact(container);
    return await retrieveEditor(container);
}


function getEditor(container: HTMLElement): TonConnectFacade {
    const editorWrapper = editors[container.id];
    if (editorWrapper) {
        return editorWrapper;
    } else{
        throw `TonConnect facade for container not found`;
    }
}

async function renderReact(container: HTMLElement): Promise<void> {
    console.info(`Rendering React TonConnect inside container(id: ${container.id}): ${container}`);
    const root = createRoot(container!);
    
    const tonConnectStorage = new TonConnectStorage(0);
    const tonConnect = new TonConnect({
        manifestUrl:"https://files.eyeauras.net/tonconnect-manifest.json",
        storage: tonConnectStorage        
    });

    console.info(`Creating TonConnect facade inside container(id: ${container.id}): ${container}`)
    const facade = new TonConnectFacade(container, tonConnect);
    editors[container.id] = facade;

    root.render(
        <StrictMode>
            <TonConnectUIProvider connector={tonConnect}>
                <BlazorTonConnectComponent container={container}/>
            </TonConnectUIProvider>
        </StrictMode>
    );
}

function BlazorTonConnectComponent({container}) {
    const [tonConnectUI, setOptions] = useTonConnectUI();
    const facade = getEditor(container);
    useEffect(() => {
        facade.updateConnectUI(tonConnectUI);
    }, [tonConnectUI]);

    return (
        <TonConnectButton/>
    );
}

async function retrieveEditor(container: HTMLElement): Promise<TonConnectFacade> {
    return new Promise((resolve, reject) => {
        let totalWaitTime = 0;
        const interval = 10;  // Polling interval
        const timeout = 1000;  // Total timeout

        const pollForEditor = () => {
            const facade = getEditor(container);
            if (facade) {
                console.info(`Retrieved TonConnect facade: ${facade}`);
                resolve(facade);
            } else {
                totalWaitTime += interval;
                if (totalWaitTime >= timeout) {
                    reject("TonConnect facade retrieval timeout");
                } else {
                    setTimeout(pollForEditor, interval);
                }
            }
        };

        setTimeout(pollForEditor, interval);
    });
}

