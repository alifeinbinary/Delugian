// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use midir::{
    Ignore, MidiInput, MidiInputConnection, MidiInputPort, MidiOutput, MidiOutputConnection,
    MidiOutputPort,
};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{Manager, Window, Wry};

#[derive(Default)]
pub struct MidiState {
    pub input: Mutex<Option<MidiInputConnection<()>>>,
    pub output: Mutex<Option<MidiOutputConnection>>,
}

#[derive(Clone, Serialize)]
struct MidiMessage {
    message: Vec<u8>,
}

fn find_port_index<T, P>(midi_device: &T, ports: &Vec<P>, target_name: &str) -> Option<usize>
where
    T: MidiDevice<P>,
    P: Clone,
{
    for (i, port) in ports.iter().enumerate() {
        if midi_device.port_name(port).unwrap() == target_name {
            println!("Found {} at index {}", target_name, i);
            return Some(i);
        }
        println!("{}: {}", i, midi_device.port_name(port).unwrap());
    }
    None
}

trait MidiDevice<P> {
    fn port_name(&self, port: &P) -> Result<String, midir::PortInfoError>;
}

// // Implement the trait for MidiInput
impl MidiDevice<MidiInputPort> for MidiInput {
    fn port_name(&self, port: &MidiInputPort) -> Result<String, midir::PortInfoError> {
        MidiInput::port_name(self, port)
    }
}

// // Implement the trait for MidiOutput
impl MidiDevice<MidiOutputPort> for MidiOutput {
    fn port_name(&self, port: &MidiOutputPort) -> Result<String, midir::PortInfoError> {
        MidiOutput::port_name(self, port)
    }
}

#[tauri::command]
fn list_midi_connections() -> HashMap<usize, String> {
    let midi_in = MidiInput::new("delugian-input");
    match midi_in {
        Ok(midi_in) => {
            let mut midi_connections = HashMap::new();
            for (i, p) in midi_in.ports().iter().enumerate() {
                let port_name = midi_in.port_name(p);
                match port_name {
                    Ok(port_name) => {
                        midi_connections.insert(i, port_name);
                    }
                    Err(e) => {
                        println!("Error getting port name: {}", e);
                    }
                }
            }
            midi_connections
        }
        Err(_) => HashMap::new(),
    }
}

#[tauri::command]
fn open_midi_connection(
    midi_state: tauri::State<'_, MidiState>,
    window: Window<Wry>,
    input_idx: usize,
) {
    let handle: Arc<Window> = Arc::new(window).clone();
    let midi_in: Result<MidiInput, midir::InitError> = MidiInput::new("delugian-input");
    let midi_out: Result<MidiOutput, midir::InitError> = MidiOutput::new("delugian-output");
    match midi_in {
        Ok(mut midi_in) => {
            midi_in.ignore(Ignore::None);
            let midi_in_ports: Vec<midir::MidiInputPort> = midi_in.ports();
            let port: Option<&midir::MidiInputPort> = midi_in_ports
                .get(find_port_index(&midi_in, &midi_in_ports, "Deluge Port 3").unwrap());
            match port {
                Some(port) => {
                    let midi_in_conn: Result<
                        MidiInputConnection<()>,
                        midir::ConnectError<MidiInput>,
                    > = midi_in.connect(
                        port,
                        "Delugian",
                        move |_, message: &[u8], _| {
                            handle
                                .emit_all(
                                    "midi_message",
                                    MidiMessage {
                                        message: message.to_vec(),
                                    },
                                )
                                .map_err(|e| {
                                    println!("Error sending midi message: {}", e);
                                })
                                .ok();
                        },
                        (),
                    );
                    match midi_in_conn {
                        Ok(midi_in_conn) => {
                            midi_state.input.lock().unwrap().replace(midi_in_conn);
                        }
                        Err(e) => {
                            println!("Error: {}", e);
                        }
                    }
                }
                None => {
                    println!("No port found at index {}", input_idx);
                }
            }
        }
        Err(e) => println!("Error: {}", e),
    }
    match midi_out {
        Ok(midi_out) => {
            let midi_out_ports: Vec<midir::MidiOutputPort> = midi_out.ports();
            let port: Option<&midir::MidiOutputPort> = midi_out_ports
                .get(find_port_index(&midi_out, &midi_out_ports, "Deluge Port 3").unwrap());
            match port {
                Some(port) => {
                    let midi_out_conn: MidiOutputConnection =
                        midi_out.connect(port, "Delugian").unwrap();
                    midi_state.output.lock().unwrap().replace(midi_out_conn);
                }
                None => {
                    println!("No port found at index {}", input_idx);
                }
            }
        }
        Err(e) => println!("Error: {}", e),
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn sysex_receive(sysex_receive_message: String) {
    println!("SysEx message received: {}", sysex_receive_message);
}
#[tauri::command]
fn sysex_send() -> String {
    "SysEx message sent:".into()
}

fn main() {
    tauri::Builder::default()
        .manage(MidiState {
            ..Default::default()
        })
        .invoke_handler(tauri::generate_handler![
            sysex_receive,
            sysex_send,
            open_midi_connection,
            list_midi_connections
        ])
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running delugian application");
}
